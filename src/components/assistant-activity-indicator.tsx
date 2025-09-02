import React from "react"
// import { useMeasure } from "react-use"
import { cx } from "../utils/cx"

export type AssistantActivityIndicatorProps = {
  state: "idle" | "thinking" | "speaking"
  stream: MediaStream | undefined
  className?: string
  children: React.ReactNode
}

// Spinner settings
// const GAP = 3
// const STROKE_LENGTH = 48

// Audio analysis settings
const FFT_SIZE = 256 // Size of the FFT (Fast Fourier Transform) for frequency analysis
const SMOOTHING_TIME_CONSTANT = 0.8 // Smoothing factor for the visualization (0-1)
const MAX_VOLUME = 150

export function AssistantActivityIndicator({
  children,
  state = "idle",
  stream,
  className,
}: AssistantActivityIndicatorProps) {
  // const [ref, bounds] = useMeasure<HTMLDivElement>()

  // const { radius, perimeter } = React.useMemo(() => {
  //   const width = bounds.width + GAP * 2
  //   const height = bounds.height + GAP * 2
  //   const radius = height / 2
  //   // Calculate the perimeter of the rectangle, accounting for the rounded corners
  //   const perimeter = (width - 2 * radius) * 2 + (height - 2 * radius) * 2 + 2 * Math.PI * radius
  //   return { radius, perimeter }
  // }, [bounds])

  const [volume, setVolume] = React.useState(0)

  React.useEffect(() => {
    let audioContext: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let animationFrameId: number

    async function setupAudio() {
      if (!stream) return

      try {
        // Initialize audio context and analyzer
        audioContext = new AudioContext()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = FFT_SIZE
        analyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT

        // Connect provided stream to analyzer
        source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)
        updateVolume(analyser)
      } catch (error) {
        console.error(error)
      }
    }

    function updateVolume(analyser: AnalyserNode) {
      // Get frequency data from the analyzer
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(dataArray)

      // Calculate average volume across all frequencies
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length

      // Normalize to 0-1 range
      const normalizedVolume = Math.min(1, average / MAX_VOLUME)

      setVolume(normalizedVolume)
      animationFrameId = requestAnimationFrame(() => updateVolume(analyser))
    }

    setupAudio()

    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      if (source) {
        source.disconnect()
      }
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [stream])

  return (
    <div
      // ref={ref}
      className={cx("relative flex", className)}
    >
      {/* {state === "thinking" ? (
        <svg
          className="pointer-events-none absolute -inset-[var(--gap)] z-10 h-[calc(100%+var(--gap)*2)] w-[calc(100%+var(--gap)*2)] overflow-visible text-border"
          style={{ "--perimeter": `${perimeter}px`, "--gap": `${GAP}px` } as React.CSSProperties}
        >
          <rect
            className="spin-stroke"
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            rx={radius}
            strokeDasharray={`${STROKE_LENGTH} ${perimeter - STROKE_LENGTH}`}
          />
        </svg>
      ) : null} */}
      {state === "thinking" || state === "speaking" ? (
        <div
          className={cx(
            "pointer-events-none absolute inset-0 ring-[calc(3px+9px*var(--volume))] ring-[var(--neutral-a4)] eink:ring-text rounded-full",
            state === "thinking" && "animate-pulse eink:animate-none",
          )}
          style={
            {
              "--volume": volume,
            } as React.CSSProperties
          }
        />
      ) : null}
      {children}
    </div>
  )
}
