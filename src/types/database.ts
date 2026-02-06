// Types miroir du schéma PostgreSQL Supabase
// Structure de base — sera enrichie avec les tables métier dans les stories suivantes

export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      chantier_type: 'complet' | 'leger'
      task_status: 'not_started' | 'in_progress' | 'done'
      delivery_status: 'commande' | 'prevu' | 'livre'
    }
    CompositeTypes: Record<string, never>
  }
}
