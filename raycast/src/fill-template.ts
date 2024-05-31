import { AI } from "@raycast/api";
import ejs from "ejs";
import { toDateString } from "../../src/utils/date";

export async function fillTemplate(template: string, webContent: string) {
  const renderedTemplate = await ejs.render(template, { date: toDateString(new Date()) }, { async: true });

  const noteContent = await AI.ask(
    `You will be provided with a note template and a text representation of a webpage. Your task is to replace all <ai></ai> tags in that template with details from the webpage. 

* Do not repond with anything expect the filled in content of the template.

§§ Example

§§§ Template

---
tags: [reference, article]
# Suggested tags: <ai>1-3 short tag suggestions based on the content of the article in lowercase. Use kebab-case if the tag is more than one word. A tag should be no more than two words.</ai>
author: <ai>Author of the article</ai>
---

# [<ai>Title of the article</ai>](<ai>URL of the article</ai>)

- <ai>One-liner description of the article</ai>

§§§ Response

---
tags: [reference, article]
# Suggested tags: ai-ux, living-documents, user-experience
author: Adam Wiggins
---

# [Living documents as an AI UX pattern](https://blog.elicit.com/living-documents-ai-ux/)

- Exploring the integration of AI into user interfaces to create dynamic, editable documents for systematic scientific reviews.

§§ Template

${renderedTemplate}

§§ Web content

${webContent}`,
    {
      // TODO: Check whether user has access to the model
      model: "openai-gpt-4-turbo",
    },
  );

  return noteContent;
}
