const VIM_MODE_KEY = "vim_mode"

export function getVimMode() {
  return window.localStorage.getItem(VIM_MODE_KEY) === "true"
}

export function setVimMode(vimMode: boolean) {
  window.localStorage.setItem(VIM_MODE_KEY, vimMode.toString())
}
