import fetch from "node-fetch";

export async function fetchWebContent(url: string) {
  const response = await fetch(`https://r.jina.ai/${url}`);

  if (!response.ok) {
    // TODO: Handle error
    console.error(response.statusText);
    return "";
  }

  return await response.text();
}
