let audioContext: AudioContext | null = null
let reactionPlayer: HTMLAudioElement | null = null

function context() {
  audioContext ??= new AudioContext()
  return audioContext
}

function player() {
  reactionPlayer ??= new Audio()
  reactionPlayer.preload = 'auto'
  return reactionPlayer
}

export async function unlockAudio() {
  const audio = context()
  if (audio.state === 'suspended') await audio.resume()
  player()
}

export async function playReactionAudio(url: string) {
  const audio = player()
  audio.pause()
  audio.currentTime = 0
  audio.src = url
  await audio.play()
}

export function stopReactionAudio() {
  if (!reactionPlayer) return
  reactionPlayer.pause()
  reactionPlayer.currentTime = 0
}

export function playReactionTone(frequencies: [number, number]) {
  const audio = context()
  const start = audio.currentTime

  frequencies.forEach((frequency, index) => {
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = index === 0 ? 'triangle' : 'sine'
    oscillator.frequency.setValueAtTime(frequency, start)
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.08, start + 0.16)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.08, start + 0.015 + index * 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start(start + index * 0.045)
    oscillator.stop(start + 0.3)
  })
}
