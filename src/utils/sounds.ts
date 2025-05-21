import { Howl } from "howler"

// Helper function to safely play sounds
export function playSound(sound: Howl) {
  try {
    // Ensure the sound is loaded
    if (sound.state() === "unloaded") {
      sound.load()
    }

    // Play the sound and handle any errors
    sound.play()
  } catch (error) {
    console.warn("Failed to play sound:", error)
  }
}

export const notificationSound = new Howl({
  src: "/sounds/notification.mp3",
  preload: false,
  onloaderror: (id, error) => {
    console.warn("Failed to load notification sound:", error)
  },
})

export const notificationOffSound = new Howl({
  src: "/sounds/notification-off.mp3",
  preload: false,
  onloaderror: (id, error) => {
    console.warn("Failed to load notification off sound:", error)
  },
})
