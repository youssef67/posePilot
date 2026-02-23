/**
 * Parse quantity from a besoin description line.
 * Supports formats:
 *   Leading:  "3x Colle", "3X colle"
 *   Trailing: "Colle x3", "Colle X3", "Colle 3x", "Colle 3X"
 * Returns { description, quantite } with cleaned description and parsed quantity.
 * Defaults to quantite=1 if no pattern found.
 */
export function parseQuantite(raw: string): { description: string; quantite: number } {
  const trimmed = raw.trim()

  // Leading: "3x ...", "3X ..."
  const leadingMatch = trimmed.match(/^(\d+)\s*[xX]\s+(.+)$/)
  if (leadingMatch) {
    const qty = parseInt(leadingMatch[1], 10)
    if (qty >= 1) return { description: leadingMatch[2].trim(), quantite: qty }
  }

  // Trailing: "... x3", "... X3", "... 3x", "... 3X"
  const trailingMatch = trimmed.match(/^(.+)\s+(?:[xX]\s*(\d+)|(\d+)\s*[xX])$/)
  if (trailingMatch) {
    const qty = parseInt(trailingMatch[2] ?? trailingMatch[3], 10)
    if (qty >= 1) return { description: trailingMatch[1].trim(), quantite: qty }
  }

  return { description: trimmed, quantite: 1 }
}
