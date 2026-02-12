export function formatMetrage(m2: number, ml: number): string | undefined {
  const parts: string[] = []
  if (m2 > 0) parts.push(`${parseFloat(m2.toFixed(1))} m²`)
  if (ml > 0) parts.push(`${parseFloat(ml.toFixed(1))} ML`)
  return parts.length > 0 ? parts.join(' · ') : undefined
}
