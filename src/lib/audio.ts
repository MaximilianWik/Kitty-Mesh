let audioContext: AudioContext | null = null

function context() {
  audioContext ??= new AudioContext()
  return audioContext
}

export async function unlockAudio() {
  const audio = context()
  if (audio.state === 'suspended') await audio.resume()
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
