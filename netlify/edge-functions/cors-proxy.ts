/// <reference lib="deno.ns" />

import type { Config } from "https://edge.netlify.com"

export default async (request: Request) => {
  console.log(request)
  return new Response("Hello, world!")
}

export const config: Config = {
  path: "/cors-proxy/*",
}
