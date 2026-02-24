// Types miroir du schema PostgreSQL Supabase
// Synchronise avec les migrations supabase/migrations/*.sql

export type Database = {
  public: {
    Tables: {
      chantiers: {
        Row: {
          id: string
          nom: string
          type: string
          status: string
          progress_done: number
          progress_total: number
          has_blocking_note: boolean
          has_open_reservation: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          nom: string
          type: string
          status?: string
          progress_done?: number
          progress_total?: number
          has_blocking_note?: boolean
          has_open_reservation?: boolean
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          nom?: string
          type?: string
          status?: string
          progress_done?: number
          progress_total?: number
          has_blocking_note?: boolean
          has_open_reservation?: boolean
          created_at?: string
          created_by?: string | null
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
          has_open_reservation: boolean
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
          has_open_reservation?: boolean
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
          has_open_reservation?: boolean
          metrage_m2_total?: number
          metrage_ml_total?: number
        }
        Relationships: []
      }
      variantes: {
        Row: {
          id: string
          plot_id: string
          nom: string
          created_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          nom: string
          created_at?: string
        }
        Update: {
          id?: string
          plot_id?: string
          nom?: string
          created_at?: string
        }
        Relationships: []
      }
      variante_pieces: {
        Row: {
          id: string
          variante_id: string
          nom: string
          created_at: string
        }
        Insert: {
          id?: string
          variante_id: string
          nom: string
          created_at?: string
        }
        Update: {
          id?: string
          variante_id?: string
          nom?: string
          created_at?: string
        }
        Relationships: []
      }
      variante_documents: {
        Row: {
          id: string
          variante_id: string
          nom: string
          is_required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          variante_id: string
          nom: string
          is_required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          variante_id?: string
          nom?: string
          is_required?: boolean
          created_at?: string
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
          has_open_reservation: boolean
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
          has_open_reservation?: boolean
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
          has_open_reservation?: boolean
          metrage_m2_total?: number
          metrage_ml_total?: number
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
          has_open_reservation: boolean
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
          has_open_reservation?: boolean
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
          has_open_reservation?: boolean
          has_missing_docs?: boolean
          metrage_m2_total?: number
          metrage_ml_total?: number
          plinth_status?: string
        }
        Relationships: []
      }
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
      lot_documents: {
        Row: {
          id: string
          lot_id: string
          nom: string
          is_required: boolean
          file_url: string | null
          file_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lot_id: string
          nom: string
          is_required?: boolean
          file_url?: string | null
          file_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lot_id?: string
          nom?: string
          is_required?: boolean
          file_url?: string | null
          file_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
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
        Insert: {
          id?: string
          lot_id?: string | null
          piece_id?: string | null
          content: string
          is_blocking?: boolean
          created_by: string
          created_by_email?: string | null
          photo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lot_id?: string | null
          piece_id?: string | null
          content?: string
          is_blocking?: boolean
          created_by?: string
          created_by_email?: string | null
          photo_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      note_responses: {
        Row: {
          id: string
          note_id: string
          content: string
          created_by: string
          created_by_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          note_id: string
          content: string
          created_by: string
          created_by_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          note_id?: string
          content?: string
          created_by?: string
          created_by_email?: string | null
          created_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          event_type: string
          actor_id: string
          actor_email: string | null
          chantier_id: string
          target_type: string
          target_id: string
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          actor_id: string
          actor_email?: string | null
          chantier_id: string
          target_type: string
          target_id: string
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          actor_id?: string
          actor_email?: string | null
          chantier_id?: string
          target_type?: string
          target_id?: string
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Relationships: []
      }
      livraisons: {
        Row: {
          id: string
          chantier_id: string | null
          description: string
          status: string
          date_prevue: string | null
          bc_file_url: string | null
          bc_file_name: string | null
          bl_file_url: string | null
          bl_file_name: string | null
          fournisseur: string | null
          montant_ttc: number | null
          parent_id: string | null
          status_history: Record<string, unknown> | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          chantier_id?: string | null
          description: string
          status?: string
          date_prevue?: string | null
          bc_file_url?: string | null
          bc_file_name?: string | null
          bl_file_url?: string | null
          bl_file_name?: string | null
          fournisseur?: string | null
          montant_ttc?: number | null
          parent_id?: string | null
          status_history?: Record<string, unknown> | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          chantier_id?: string | null
          description?: string
          status?: string
          date_prevue?: string | null
          bc_file_url?: string | null
          bc_file_name?: string | null
          bl_file_url?: string | null
          bl_file_name?: string | null
          fournisseur?: string | null
          montant_ttc?: number | null
          parent_id?: string | null
          status_history?: Record<string, unknown> | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      besoins: {
        Row: {
          id: string
          chantier_id: string
          description: string
          quantite: number
          montant_unitaire: number | null
          livraison_id: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          chantier_id: string
          description: string
          quantite?: number
          montant_unitaire?: number | null
          livraison_id?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          chantier_id?: string
          description?: string
          quantite?: number
          montant_unitaire?: number | null
          livraison_id?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      inventaire: {
        Row: {
          id: string
          chantier_id: string
          plot_id: string | null
          etage_id: string | null
          designation: string
          quantite: number
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          chantier_id: string
          plot_id?: string | null
          etage_id?: string | null
          designation: string
          quantite?: number
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          chantier_id?: string
          plot_id?: string | null
          etage_id?: string | null
          designation?: string
          quantite?: number
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      lot_photos: {
        Row: {
          id: string
          lot_id: string
          photo_url: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          lot_id: string
          photo_url: string
          created_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          lot_id?: string
          photo_url?: string
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          id: string
          lot_id: string
          piece_id: string
          description: string
          photo_url: string | null
          status: 'ouvert' | 'resolu'
          resolved_at: string | null
          created_by: string
          created_by_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lot_id: string
          piece_id: string
          description: string
          photo_url?: string | null
          status?: 'ouvert' | 'resolu'
          resolved_at?: string | null
          created_by: string
          created_by_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lot_id?: string
          piece_id?: string
          description?: string
          photo_url?: string | null
          status?: 'ouvert' | 'resolu'
          resolved_at?: string | null
          created_by?: string
          created_by_email?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      create_lot_with_inheritance: {
        Args: {
          p_code: string
          p_variante_id: string
          p_etage_nom: string
          p_plot_id: string
        }
        Returns: string
      }
      create_batch_lots_with_inheritance: {
        Args: {
          p_codes: string[]
          p_variante_id: string
          p_etage_nom: string
          p_plot_id: string
        }
        Returns: string[]
      }
      add_piece_to_lot: {
        Args: {
          p_lot_id: string
          p_piece_nom: string
        }
        Returns: string
      }
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
      chantier_status: 'active' | 'termine' | 'supprime'
      task_status: 'not_started' | 'in_progress' | 'done'
      delivery_status: 'commande' | 'prevu' | 'livre'
      plinth_status: 'non_commandees' | 'commandees' | 'faconnees'
      reservation_status: 'ouvert' | 'resolu'
      activity_event_type: 'task_status_changed' | 'note_added' | 'photo_added' | 'blocking_noted' | 'besoin_added' | 'besoin_ordered' | 'besoin_updated' | 'besoin_deleted' | 'livraison_created' | 'livraison_status_changed' | 'livraison_updated' | 'livraison_deleted' | 'inventaire_added' | 'inventaire_updated' | 'reservation_created' | 'reservation_resolved'
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
    description_preview?: string
    designation?: string
    quantite?: number
    old_quantite?: number
    reservation_id?: string
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

// Type miroir de la table note_responses (027_note_responses.sql)
export interface NoteResponse {
  id: string
  note_id: string
  content: string
  created_by: string
  created_by_email: string | null
  created_at: string
}

// Type miroir de la table lot_photos (033_lot_photos.sql)
export interface LotPhoto {
  id: string
  lot_id: string
  photo_url: string
  created_by: string
  created_at: string
}

// Type miroir de la table inventaire (018_inventaire.sql + 026_stockage_general)
export interface Inventaire {
  id: string
  chantier_id: string
  plot_id: string | null
  etage_id: string | null
  designation: string
  quantite: number
  created_at: string
  created_by: string | null
}

// Type miroir de la table reservations (036_reservations.sql)
export interface Reservation {
  id: string
  lot_id: string
  piece_id: string
  description: string
  photo_url: string | null
  status: 'ouvert' | 'resolu'
  resolved_at: string | null
  created_by: string
  created_by_email: string | null
  created_at: string
  pieces?: { nom: string }
}

// Type miroir de la table besoins (016_besoins_livraisons.sql)
export interface Besoin {
  id: string
  chantier_id: string
  description: string
  quantite: number
  montant_unitaire: number | null
  livraison_id: string | null
  created_at: string
  created_by: string | null
}

// Status history entry for livraison timeline
export interface StatusHistoryEntry {
  status: string
  date: string
}

// Type miroir de la table livraisons (016_besoins_livraisons.sql + 029/031/032)
export interface Livraison {
  id: string
  chantier_id: string | null
  description: string
  status: 'commande' | 'prevu' | 'livraison_prevue' | 'a_recuperer' | 'receptionne' | 'recupere' | 'livre'
  fournisseur: string | null
  date_prevue: string | null
  montant_ttc: number | null
  bc_file_url: string | null
  bc_file_name: string | null
  bl_file_url: string | null
  bl_file_name: string | null
  parent_id: string | null
  status_history: StatusHistoryEntry[] | null
  created_at: string
  created_by: string | null
}
