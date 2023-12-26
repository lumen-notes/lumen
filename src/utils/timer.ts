const START_LABEL = ["%c[START]", "color: black; background: aquamarine"]
const END_LABEL = "[END]"

export function startTimer(label: string) {
  console.log(...START_LABEL, label)
  console.time(`${END_LABEL} ${label}`)

  return () => {
    console.timeEnd(`${END_LABEL} ${label}`)
  }
}
