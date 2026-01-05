import { openai } from "@ai-sdk/openai"
import { convertToModelMessages, streamText, UIMessage } from "ai"

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json()

  const result = streamText({
    model: "anthropic/claude-haiku-4.5",
    messages: await convertToModelMessages(messages),
    tools: {
      web_search: openai.tools.webSearch(),
    },
  })

  return result.toUIMessageStreamResponse()
}
