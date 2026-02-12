// Enums miroir des types PostgreSQL
// Synchronisés avec supabase/migrations/001_enums.sql

export const ChantierType = {
  COMPLET: 'complet',
  LEGER: 'leger',
} as const
export type ChantierType = (typeof ChantierType)[keyof typeof ChantierType]

export const TaskStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]

export const DeliveryStatus = {
  COMMANDE: 'commande',
  PREVU: 'prevu',
  LIVRE: 'livre',
} as const
export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus]

export const PlinthStatus = {
  NON_COMMANDEES: 'non_commandees',
  COMMANDEES: 'commandees',
  FACONNEES: 'faconnees',
} as const
export type PlinthStatus = (typeof PlinthStatus)[keyof typeof PlinthStatus]
