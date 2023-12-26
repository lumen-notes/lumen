module.exports = {
  globDirectory: "dist/",
  globPatterns: ["**/*.{html,css,js,woff2}"],
  swDest: "dist/service-worker.js",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
  skipWaiting: true,
  navigateFallback: "index.html",
  // Do not cache edge function routes
  navigateFallbackDenylist: [/cors-proxy/, /git-lfs-file/, /github-auth/],
}
