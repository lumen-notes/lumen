import { AI } from "@raycast/api";
import { Template } from "./templates";

export async function chooseTemplate<T extends Record<string, Template>>(
  templates: T,
  webContent: string,
): Promise<keyof T> {
  const templateId = await AI.ask(
    `You will be provided with a JSON list of note templates and a text representation of a webpage. Your task is to choose the most relavant template based on the content of the webpage and respond with the id of that template.

* Do not repond with anything expect the template id.

§§ Templates

${JSON.stringify(templates)}

§§ Web content

${webContent}`,
    {
      // TODO: Check whether user has access to the model
      model: "openai-gpt-4-turbo",
    },
  );

  if (!(templateId in templates)) {
    // TODO: Handle error
    return Object.keys(templates)[0];
  }

  return templateId;
}
