const START_LABEL = ["%c[start]", "color: black; background: lightgreen; border-radius: 2px"]
const END_LABEL = "[end]"

export function startTimer(label: string) {
  console.log(...START_LABEL, label)
  console.time(`${END_LABEL} ${label}`)

  return () => {
    console.timeEnd(`${END_LABEL} ${label}`)
  }
}
