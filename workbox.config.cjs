module.exports = {
  globDirectory: "dist/",
  globPatterns: ["**/*.{css,js,woff2}"],
  swDest: "dist/sw.js",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
}
