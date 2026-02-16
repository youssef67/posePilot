// Types miroir du schéma PostgreSQL Supabase
// Structure de base — sera enrichie avec les tables métier dans les stories suivantes

export type Database = {
  public: {
    Tables: {
      pieces: {
        Row: {
          id: string
          lot_id: string
          nom: string
          created_at: string
          progress_done: number
          progress_total: number
          metrage_m2: number | null
          metrage_ml: number | null
        }
        Insert: {
          id?: string
          lot_id: string
          nom: string
          created_at?: string
          progress_done?: number
          progress_total?: number
          metrage_m2?: number | null
          metrage_ml?: number | null
        }
        Update: {
          id?: string
          lot_id?: string
          nom?: string
          created_at?: string
          progress_done?: number
          progress_total?: number
          metrage_m2?: number | null
          metrage_ml?: number | null
        }
        Relationships: []
      }
      lots: {
        Row: {
          id: string
          etage_id: string
          variante_id: string
          plot_id: string
          code: string
          is_tma: boolean
          created_at: string
          progress_done: number
          progress_total: number
          has_blocking_note: boolean
          has_missing_docs: boolean
          metrage_m2_total: number
          metrage_ml_total: number
          plinth_status: string
        }
        Insert: {
          id?: string
          etage_id: string
          variante_id: string
          plot_id: string
          code: string
          is_tma?: boolean
          created_at?: string
          progress_done?: number
          progress_total?: number
          has_blocking_note?: boolean
          has_missing_docs?: boolean
          metrage_m2_total?: number
          metrage_ml_total?: number
          plinth_status?: string
        }
        Update: {
          id?: string
          etage_id?: string
          variante_id?: string
          plot_id?: string
          code?: string
          is_tma?: boolean
          created_at?: string
          progress_done?: number
          progress_total?: number
          has_blocking_note?: boolean
          has_missing_docs?: boolean
          metrage_m2_total?: number
          metrage_ml_total?: number
          plinth_status?: string
        }
        Relationships: []
      }
      etages: {
        Row: {
          id: string
          plot_id: string
          nom: string
          created_at: string
          progress_done: number
          progress_total: number
          has_blocking_note: boolean
          metrage_m2_total: number
          metrage_ml_total: number
        }
        Insert: {
          id?: string
          plot_id: string
          nom: string
          created_at?: string
          progress_done?: number
          progress_total?: number
          has_blocking_note?: boolean
          metrage_m2_total?: number
          metrage_ml_total?: number
        }
        Update: {
          id?: string
          plot_id?: string
          nom?: string
          created_at?: string
          progress_done?: number
          progress_total?: number
          has_blocking_note?: boolean
          metrage_m2_total?: number
          metrage_ml_total?: number
        }
        Relationships: []
      }
      plots: {
        Row: {
          id: string
          chantier_id: string
          nom: string
          task_definitions: string[]
          created_at: string
          progress_done: number
          progress_total: number
          has_blocking_note: boolean
          metrage_m2_total: number
          metrage_ml_total: number
        }
        Insert: {
          id?: string
          chantier_id: string
          nom: string
          task_definitions?: string[]
          created_at?: string
          progress_done?: number
          progress_total?: number
          has_blocking_note?: boolean
          metrage_m2_total?: number
          metrage_ml_total?: number
        }
        Update: {
          id?: string
          chantier_id?: string
          nom?: string
          task_definitions?: string[]
          created_at?: string
          progress_done?: number
          progress_total?: number
          has_blocking_note?: boolean
          metrage_m2_total?: number
          metrage_ml_total?: number
        }
        Relationships: []
      }
      taches: {
        Row: {
          id: string
          piece_id: string
          nom: string
          status: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          piece_id: string
          nom: string
          status?: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          piece_id?: string
          nom?: string
          status?: string
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: unknown[]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      reorder_taches: {
        Args: {
          p_tache_ids: string[]
        }
        Returns: undefined
      }
      duplicate_plot: {
        Args: {
          p_source_plot_id: string
          p_new_plot_nom: string
        }
        Returns: string
      }
    }
    Enums: {
      chantier_type: 'complet' | 'leger'
      task_status: 'not_started' | 'in_progress' | 'done'
      delivery_status: 'commande' | 'prevu' | 'livre'
      plinth_status: 'non_commandees' | 'commandees' | 'faconnees'
      activity_event_type: 'task_status_changed' | 'note_added' | 'photo_added' | 'blocking_noted' | 'besoin_added' | 'besoin_ordered' | 'besoin_updated' | 'besoin_deleted' | 'livraison_created' | 'livraison_status_changed' | 'livraison_updated' | 'livraison_deleted' | 'inventaire_added' | 'inventaire_updated'
    }
    CompositeTypes: { [_ in never]: never }
  }
}

// Type miroir de la table activity_logs (013_activity_log.sql)
export type ActivityEventType = Database['public']['Enums']['activity_event_type']

export interface ActivityLog {
  id: string
  event_type: ActivityEventType
  actor_id: string
  actor_email: string | null
  chantier_id: string
  target_type: string
  target_id: string
  metadata: {
    piece_nom?: string | null
    lot_code?: string | null
    old_status?: string
    new_status?: string
    content_preview?: string
    description?: string
    designation?: string
    quantite?: number
    old_quantite?: number
  }
  created_at: string
}

// Type miroir de la table lot_documents (007_lots.sql + 014_lot_documents_file.sql)
export interface LotDocument {
  id: string
  lot_id: string
  nom: string
  is_required: boolean
  file_url: string | null
  file_name: string | null
  created_at: string
}

// Type miroir de la table notes (011_notes.sql)
export interface Note {
  id: string
  lot_id: string | null
  piece_id: string | null
  content: string
  is_blocking: boolean
  created_by: string
  created_by_email: string | null
  photo_url: string | null
  created_at: string
}

// Type miroir de la table inventaire (018_inventaire.sql)
export interface Inventaire {
  id: string
  chantier_id: string
  plot_id: string
  etage_id: string
  designation: string
  quantite: number
  created_at: string
  created_by: string | null
}

// Type miroir de la table besoins (016_besoins_livraisons.sql)
export interface Besoin {
  id: string
  chantier_id: string
  description: string
  livraison_id: string | null
  created_at: string
  created_by: string | null
}

// Type miroir de la table livraisons (016_besoins_livraisons.sql)
export interface Livraison {
  id: string
  chantier_id: string
  description: string
  status: 'commande' | 'prevu' | 'livre'
  fournisseur: string | null
  date_prevue: string | null
  bc_file_url: string | null
  bc_file_name: string | null
  bl_file_url: string | null
  bl_file_name: string | null
  created_at: string
  created_by: string | null
}
