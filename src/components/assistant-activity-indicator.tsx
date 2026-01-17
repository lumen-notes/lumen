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
    <div className={cx("relative flex", className)}>
      {state === "thinking" || state === "speaking" ? (
        <div
          className={cx(
            "pointer-events-none absolute inset-0 ring-[calc(3px+9px*var(--volume))] ring-[var(--neutral-a4)] epaper:ring-text rounded-full",
            state === "thinking" && "animate-pulse epaper:animate-none",
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
