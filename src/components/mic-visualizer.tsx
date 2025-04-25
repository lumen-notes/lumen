import React from "react"

// Visualization settings
const BAR_COUNT = 3 // Number of bars in the visualization
const MIN_BAR_HEIGHT = 3 // Minimum height of each bar in pixels
const MAX_BAR_HEIGHT = 16 // Maximum height of each bar in pixels
const BAR_WIDTH = 3 // Width of each bar in pixels

// Audio analysis settings
const FFT_SIZE = 256 // Size of the FFT (Fast Fourier Transform) for frequency analysis
const SMOOTHING_TIME_CONSTANT = 0.8 // Smoothing factor for the visualization (0-1)
const DEFAULT_SAMPLE_RATE = 44100 // Default audio sample rate in Hz

// Frequency ranges for each bar (in Hz)
const FREQUENCY_RANGES = [
  [0, 400], // Bass frequencies
  [400, 1600], // Mid frequencies
  [1600, 4000], // High frequencies
] as const

export function MicVisualizer() {
  const [levels, setLevels] = React.useState<number[]>(Array(BAR_COUNT).fill(0))

  React.useEffect(() => {
    let audioContext: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let animationFrameId: number

    async function setupAudio() {
      try {
        // Initialize audio context and analyzer
        audioContext = new AudioContext()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = FFT_SIZE
        analyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT

        // Get microphone access and connect to analyzer
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)
        updateLevels(analyser)
      } catch (error) {
        console.error(error)
      }
    }

    function updateLevels(analyser: AnalyserNode) {
      // Get frequency data from the analyzer
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(dataArray)

      // Calculate levels for each frequency range
      const levels = FREQUENCY_RANGES.map(([low, high]) => {
        // Convert frequency ranges to array indices
        const lowIndex = Math.floor(
          (low / (audioContext?.sampleRate || DEFAULT_SAMPLE_RATE)) * analyser.frequencyBinCount,
        )
        const highIndex = Math.floor(
          (high / (audioContext?.sampleRate || DEFAULT_SAMPLE_RATE)) * analyser.frequencyBinCount,
        )

        // Calculate average for this frequency range
        const rangeData = dataArray.slice(lowIndex, highIndex)
        const average = rangeData.reduce((a, b) => a + b, 0) / rangeData.length

        // Normalize
        return Math.min(1, average / 255)
      })

      setLevels(levels)
      animationFrameId = requestAnimationFrame(() => updateLevels(analyser))
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
  }, [])

  return (
    <div className="flex gap-0.5 items-center">
      {levels.map((level, index) => (
        <div
          key={index}
          className="rounded-full bg-[currentColor]"
          style={{
            width: `${BAR_WIDTH}px`,
            height: `${MIN_BAR_HEIGHT + level * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT)}px`,
          }}
        />
      ))}
    </div>
  )
}
