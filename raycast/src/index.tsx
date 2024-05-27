import { AI, Action, ActionPanel, Form, Toast, getPreferenceValues, showToast } from "@raycast/api";
import { FormValidation, OAuthService, getAccessToken, useForm, withAccessToken } from "@raycast/utils";
import fetch from "node-fetch";
import { Octokit } from "octokit";
import { useRef, useState } from "react";

// TODO: Add UI for managing templates
// TODO: Support EJS templates
const templates = [
  {
    id: "book",
    title: "Book",
    template: `---
tags: [reference, book]
isbn: <ai>ISBN 13 of the book</ai>
author: <ai>Author of the book</ai>
---

# <ai>Title of the book (excluding subtitle)</ai>

- <ai>One-liner description of the book</ai>`,
  },
  {
    id: "article",
    title: "Article",
    template: `---
tags: [reference, article]
# Suggested tags: <ai>1-3 short tag suggestions based on the content of the article in lowercase. Use kebab-case if the tag is more than one word. A tag should be no more than two words.</ai>
author: <ai>Author of the article</ai>
---

# [<ai>Title of the article</ai>](<ai>URL of the article</ai>)

- <ai>One-liner description of the article</ai>`,
  },
  {
    id: "app",
    title: "App",
    template: `---
tags: [reference, app]
---

# [<ai>Name of the app</ai>](<ai>URL of the app landing page</ai>)

- <ai>One-liner description of the app</ai>`,
  },
];

type FormValues = {
  noteContent: string;
};

function Command() {
  const urlRef = useRef<Form.TextField>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { handleSubmit, itemProps, setValue, reset } = useForm<FormValues>({
    onSubmit: async (values) => {
      const { token } = getAccessToken();
      const octokit = new Octokit({ auth: token, request: { fetch } });

      // TODO: Should this be configurable?
      const path = `${Date.now()}.md`;

      // TODO: Validate repository format
      const [owner, repo] = getPreferenceValues<{ repository: string }>().repository.split("/");

      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Creating note...",
      });

      try {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message: `Create ${path}`,
          content: Buffer.from(values.noteContent).toString("base64"),
        });

        // Show success message
        toast.style = Toast.Style.Success;
        toast.title = "Created note";

        // Reset form
        reset();
        urlRef.current?.reset();
        urlRef.current?.focus();
      } catch (error) {
        // Show error message
        toast.style = Toast.Style.Failure;
        toast.title = "Failed to create note";
        if (error instanceof Error) {
          toast.message = error.message;
        }
      }
    },
    validation: {
      noteContent: FormValidation.Required,
    },
  });

  return (
    <>
      <Form
        isLoading={isLoading}
        actions={
          <ActionPanel>
            <Action.SubmitForm title="Create Note" onSubmit={handleSubmit} />
          </ActionPanel>
        }
      >
        <Form.TextField
          ref={urlRef}
          id="url"
          title="URL"
          placeholder="https://example.com"
          autoFocus
          onChange={async (url) => {
            // If value is not a valid HTTP URL, return early
            const urlRegex = new RegExp("^(http|https)://", "i");
            if (!urlRegex.test(url)) {
              return;
            }

            setIsLoading(true);

            const response = await fetch(`https://r.jina.ai/${url}`);

            if (!response.ok) {
              // TODO: Handle error
              return;
            }

            const text = await response.text();

            const answer = await AI.ask(
              `You will be provided with a list of note templates and a text representation of a webpage. Your task is to choose the most relavant template based on the content of the webpage and fill in that template with details from the webpage. Do not repond with anything expect the filled in content of the template.\n\n${JSON.stringify(templates)}\n\n${text}`,
              {
                // TODO: Allow users to select the model
                // TODO: Check whether user has access to the model
                // @ts-expect-error gpt-4o is supported
                model: "openai-gpt-4o",
              },
            );

            setValue("noteContent", answer);
            setIsLoading(false);
          }}
        />
        <Form.Separator />
        {/* TODO: Add a dropdown to manually select a template if the AI choice is incorrect */}
        {/* <Form.Dropdown id="template" title="Template">
          <Form.Dropdown.Item value="dropdown-item" title="Dropdown Item" />
        </Form.Dropdown> */}
        <Form.TextArea title="Note" {...itemProps.noteContent} />
      </Form>
    </>
  );
}

const githubClient = OAuthService.github({ scope: "repo" });

export default withAccessToken(githubClient)(Command);
