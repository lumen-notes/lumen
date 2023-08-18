/* eslint-env webextensions */

const ENDPOINT = "https://app.uselumen.com"

const iframe = document.querySelector("iframe")

// TODO: github-repo, gist, book, video
/** @type {'website'} */
const contentType = "website"

const { title, url } = await getActiveTab()

const date = getDateString()

const body = `---
date_saved: ${date}
tags: [${contentType}]
---

# [${title}](${url})
`

// Change src of iframe
iframe.src = `${ENDPOINT}/new?body=${encodeURIComponent(body)}`

async function getActiveTab() {
  const options = { active: true, lastFocusedWindow: true }
  const [tab] = await chrome.tabs.query(options)
  return tab
}

/** Get current date in ISO format */
function getDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
