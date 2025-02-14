export async function validateOpenAIKey(key: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    })
    return response.status === 200
  } catch (error) {
    return false
  }
}
