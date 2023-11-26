module.exports = {
  globDirectory: "dist/",
  globPatterns: ["**/*.{html,css,js,woff2}"],
  swDest: "dist/service-worker.js",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
  skipWaiting: true,
  navigateFallback: "index.html",
  navigateFallbackDenylist: [/github-auth/, /git-lfs-file/],
}
