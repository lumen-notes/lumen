import { Action, ActionPanel, Form, Toast, getPreferenceValues, showToast } from "@raycast/api";
import { OAuthService, getAccessToken, withAccessToken } from "@raycast/utils";
import fetch from "node-fetch";
import { Octokit } from "octokit";
import { useRef, useState } from "react";
import { chooseTemplate } from "./choose-template";
import { fetchWebContent } from "./fetch-web-content";
import { fillTemplate } from "./fill-template";
import { templates } from "./templates";

function Command() {
  const urlRef = useRef<Form.TextField>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [webContent, setWebContent] = useState("");
  const [templateId, setTemplateId] = useState(Object.keys(templates)[0]);
  const [noteContent, setNoteContent] = useState<string | null>(null);

  function reset() {
    // Clear form values
    urlRef.current?.reset();
    setWebContent("");
    setNoteContent(null);

    // Focus url field
    urlRef.current?.focus();
  }

  async function handleSubmit() {
    setIsLoading(true);

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Creating note...",
    });

    const { token } = getAccessToken();
    const octokit = new Octokit({ auth: token, request: { fetch } });

    // TODO: Should this be configurable?
    const path = `${Date.now()}.md`;

    const [owner, repo] = getPreferenceValues<{ repository: string }>().repository.split("/");

    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `Create ${path}`,
        content: Buffer.from(noteContent || "").toString("base64"),
      });

      // Show success message
      toast.style = Toast.Style.Success;
      toast.title = `Created ${path} in ${owner}/${repo}`;

      reset();
    } catch (error) {
      // Show error message
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to create note";
      if (error instanceof Error) {
        toast.message = error.message;
      }
    }

    setIsLoading(false);
  }

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

            const toast = await showToast({ style: Toast.Style.Animated, title: "Fetching web content..." });
            const webContent = await fetchWebContent(url);

            toast.title = "Choosing note template...";
            const templateId = await chooseTemplate(templates, webContent);

            toast.title = "Generating note content...";
            const noteContent = await fillTemplate(templates[templateId].template, webContent);

            setWebContent(webContent);
            setTemplateId(templateId);
            setNoteContent(noteContent);

            toast.style = Toast.Style.Success;
            toast.title = "Generated note content";

            setIsLoading(false);
          }}
        />
        {noteContent !== null ? (
          <>
            <Form.Separator />
            <Form.Dropdown
              id="template"
              title="Template"
              value={templateId}
              onChange={async (value) => {
                setTemplateId(value);

                if (!webContent) {
                  return;
                }

                setIsLoading(true);

                const toast = await showToast({ style: Toast.Style.Animated, title: "Generating note content..." });
                const noteContent = await fillTemplate(templates[value].template, webContent);

                setNoteContent(noteContent);

                toast.style = Toast.Style.Success;
                toast.title = "Generated note content";

                setIsLoading(false);
              }}
            >
              {Object.values(templates).map((template) => (
                <Form.Dropdown.Item key={template.id} value={template.id} title={template.title} />
              ))}
            </Form.Dropdown>
            <Form.TextArea id="noteContent" title="Note" value={noteContent} onChange={setNoteContent} />
          </>
        ) : null}
      </Form>
    </>
  );
}

export default withAccessToken(OAuthService.github({ scope: "repo" }))(Command);
