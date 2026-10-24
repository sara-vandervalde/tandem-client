// The color comes from the name, so the same person or group always gets the same color
const palette = ['#4a3279', '#ff6b4a', '#23896a', '#c2477a', '#3a6fb0', '#b7791f', '#6b3f8f']

export function colorFor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return palette[Math.abs(hash) % palette.length]
}
