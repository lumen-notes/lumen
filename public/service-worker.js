// TODO: Implement caching strategies

self.addEventListener("install", (event) => {
  event.waitUntil(() => {
    console.log("Service worker installed")
  })
})

self.addEventListener("activate", (event) => {
  event.waitUntil(() => {
    console.log("Service worker activated")
  })
})

self.addEventListener("fetch", (event) => {
  console.log("Fetch intercepted for:", event.request)
})
