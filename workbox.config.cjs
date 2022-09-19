module.exports = {
  globDirectory: "dist/",
  globPatterns: ["**/*.{css,js,woff2}"],
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
    },
  ],
  swDest: "dist/service-worker.js",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
}
