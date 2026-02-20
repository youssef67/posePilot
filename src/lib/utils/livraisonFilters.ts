export type StatusFilter = 'tous' | 'a_traiter' | 'en_cours' | 'termine'

export const FILTER_STATUSES: Record<StatusFilter, string[]> = {
  tous: [],
  a_traiter: ['prevu', 'commande'],
  en_cours: ['livraison_prevue', 'a_recuperer'],
  termine: ['receptionne', 'recupere'],
}

export function countByFilter<T extends { status: string }>(livraisons: T[], filter: StatusFilter): number {
  if (filter === 'tous') return livraisons.length
  const statuses = FILTER_STATUSES[filter]
  return livraisons.filter((l) => statuses.includes(l.status)).length
}
