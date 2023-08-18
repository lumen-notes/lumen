/* eslint-env webextensions */

console.log("hello from background.js")

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  // TODO: Add support for "editable", "image", "video", "audio"
  const contexts = ["page", "selection", "link"]

  for (const context of contexts) {
    chrome.contextMenus.create({
      title: `Save ${capitalize(context)} to Lumen`,
      id: `save-${context}`,
      contexts: [context],
    })
  }
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case "save-page":
      console.log("save-page", info, tab)
      // Not supported yet: https://developer.chrome.com/docs/extensions/reference/action/#method-openPopup
      // chrome.action.openPopup()
      break

    case "save-selection":
      console.log("save-selection", info, tab)
      break

    case "save-link":
      console.log("save-link", info, tab)
      break
  }
})

/** Capitalize first letter of string */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
