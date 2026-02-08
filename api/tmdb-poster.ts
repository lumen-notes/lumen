/**
 * Proxies movie/TV poster images from TMDb, looked up by IMDb ID.
 * Usage: /api/tmdb-poster?imdbId=tt0111161&size=w185
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const url = getRequestUrl(request)
    const imdbId = url.searchParams.get("imdbId")
    const size = url.searchParams.get("size") || "w185"

    if (!imdbId) {
      return new Response("Missing 'imdbId' query parameter", { status: 400 })
    }

    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) {
      return new Response("TMDB_API_KEY not configured", { status: 500 })
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    )

    if (!response.ok) {
      return new Response("TMDb API error", { status: 502 })
    }

    const data = (await response.json()) as Record<string, { poster_path: string | null }[]>

    // Check movie, TV, and episode results in order
    const posterPath = ["movie_results", "tv_results", "tv_episode_results"]
      .flatMap((key) => data[key] ?? [])
      .find((result) => result.poster_path)?.poster_path

    if (!posterPath) {
      return new Response("No poster found", { status: 404 })
    }

    // Proxy the image to avoid redirect issues in dev
    const imageResponse = await fetch(`https://image.tmdb.org/t/p/${size}${posterPath}`)

    if (!imageResponse.ok) {
      return new Response("Failed to fetch poster image", { status: 502 })
    }

    return new Response(imageResponse.body, {
      headers: {
        "Content-Type": imageResponse.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return new Response(`Error: ${message}`, { status: 500 })
  }
}

function getRequestUrl(request: Request): URL {
  try {
    return new URL(request.url)
  } catch {
    const host = request.headers.get("host") ?? "localhost"
    const proto = request.headers.get("x-forwarded-proto") ?? "http"
    return new URL(request.url, `${proto}://${host}`)
  }
}
