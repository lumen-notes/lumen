import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function POST(request: Request): Promise<Response> {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch GitHub user to validate token and get canonical GitHub id and login
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    })

    if (userResponse.status === 401) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!userResponse.ok) {
      throw new Error(`GitHub user lookup failed: ${userResponse.status}`)
    }

    const { id: github_id, login: github_login } = await userResponse.json()

    if (typeof github_id !== "number" || !github_login) {
      throw new Error("Invalid GitHub user response")
    }

    // Upsert user record and get user id
    const { data: user, error: userError } = await supabase
      .from("users")
      .upsert(
        { github_id, github_login, last_active_at: new Date().toISOString() },
        { onConflict: "github_id" },
      )
      .select("id")
      .single()

    if (userError) {
      throw userError
    }

    // Log the `opened_app` event
    const userAgent = request.headers.get("user-agent")
    const { error: activityError } = await supabase
      .from("activity")
      .insert({ user_id: user.id, type: "opened_app", user_agent: userAgent })

    if (activityError) {
      throw activityError
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Failed to log user:", error)
    return new Response(JSON.stringify({ error: "Failed to log user" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

function getAuthToken(request: Request): string {
  const authHeader = request.headers.get("authorization") ?? ""
  if (!authHeader) return ""
  const [scheme, ...rest] = authHeader.split(" ")
  if (!scheme) return ""
  const normalizedScheme = scheme.toLowerCase()
  if (normalizedScheme !== "bearer" && normalizedScheme !== "token") return ""
  return rest.join(" ").trim()
}
