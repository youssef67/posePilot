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
          ajustement_depenses: number
          cout_sous_traitance: number
          cout_materiaux_total: number
          memo_count: number
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
          ajustement_depenses?: number
          cout_sous_traitance?: number
          cout_materiaux_total?: number
          memo_count?: number
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
          ajustement_depenses?: number
          cout_sous_traitance?: number
          cout_materiaux_total?: number
          memo_count?: number
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
          task_config: Record<string, { bloquant_pose: boolean }>
          created_at: string
          progress_done: number
          progress_total: number
          has_blocking_note: boolean
          has_open_reservation: boolean
          metrage_m2_total: number
          metrage_ml_total: number
          cout_materiaux_total: number
        }
        Insert: {
          id?: string
          chantier_id: string
          nom: string
          task_definitions?: string[]
          task_config?: Record<string, { bloquant_pose: boolean }>
          created_at?: string
          progress_done?: number
          progress_total?: number
          has_blocking_note?: boolean
          has_open_reservation?: boolean
          metrage_m2_total?: number
          metrage_ml_total?: number
          cout_materiaux_total?: number
        }
        Update: {
          id?: string
          chantier_id?: string
          nom?: string
          task_definitions?: string[]
          task_config?: Record<string, { bloquant_pose: boolean }>
          created_at?: string
          progress_done?: number
          progress_total?: number
          has_blocking_note?: boolean
          has_open_reservation?: boolean
          metrage_m2_total?: number
          metrage_ml_total?: number
          cout_materiaux_total?: number
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
          task_overrides: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          variante_id: string
          nom: string
          task_overrides?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          variante_id?: string
          nom?: string
          task_overrides?: string[] | null
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
          allow_multiple: boolean
          created_at: string
        }
        Insert: {
          id?: string
          variante_id: string
          nom: string
          is_required?: boolean
          allow_multiple?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          variante_id?: string
          nom?: string
          is_required?: boolean
          allow_multiple?: boolean
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
          cout_materiaux_total: number
          memo_count: number
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
          cout_materiaux_total?: number
          memo_count?: number
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
          cout_materiaux_total?: number
          memo_count?: number
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
          position: number
          created_at: string
          progress_done: number
          progress_total: number
          has_blocking_note: boolean
          has_open_reservation: boolean
          has_missing_docs: boolean
          metrage_m2_total: number
          metrage_ml_total: number
          plinth_status: string
          has_inventaire: boolean
          cout_materiaux: number
          materiaux_recus: boolean
          intervenant_id: string | null
        }
        Insert: {
          id?: string
          etage_id: string
          variante_id: string
          plot_id: string
          code: string
          position?: number
          created_at?: string
          progress_done?: number
          progress_total?: number
          has_blocking_note?: boolean
          has_open_reservation?: boolean
          has_missing_docs?: boolean
          metrage_m2_total?: number
          metrage_ml_total?: number
          plinth_status?: string
          has_inventaire?: boolean
          cout_materiaux?: number
          materiaux_recus?: boolean
          intervenant_id?: string | null
        }
        Update: {
          id?: string
          etage_id?: string
          variante_id?: string
          plot_id?: string
          code?: string
          position?: number
          created_at?: string
          progress_done?: number
          progress_total?: number
          has_blocking_note?: boolean
          has_open_reservation?: boolean
          has_missing_docs?: boolean
          metrage_m2_total?: number
          metrage_ml_total?: number
          plinth_status?: string
          has_inventaire?: boolean
          cout_materiaux?: number
          materiaux_recus?: boolean
          intervenant_id?: string | null
        }
        Relationships: []
      }
      intervenants: {
        Row: {
          id: string
          nom: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          nom: string
          created_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          nom?: string
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      lot_badges: {
        Row: {
          id: string
          chantier_id: string
          nom: string
          couleur: string
          created_at: string
        }
        Insert: {
          id?: string
          chantier_id: string
          nom: string
          couleur?: string
          created_at?: string
        }
        Update: {
          id?: string
          chantier_id?: string
          nom?: string
          couleur?: string
          created_at?: string
        }
        Relationships: []
      }
      lot_badge_assignments: {
        Row: {
          lot_id: string
          badge_id: string
          created_at: string
        }
        Insert: {
          lot_id: string
          badge_id: string
          created_at?: string
        }
        Update: {
          lot_id?: string
          badge_id?: string
          created_at?: string
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
          bloquant_pose: boolean
          created_at: string
        }
        Insert: {
          id?: string
          piece_id: string
          nom: string
          status?: string
          position?: number
          bloquant_pose?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          piece_id?: string
          nom?: string
          status?: string
          position?: number
          bloquant_pose?: boolean
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
          allow_multiple: boolean
          file_url: string | null
          file_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lot_id: string
          nom: string
          is_required?: boolean
          allow_multiple?: boolean
          file_url?: string | null
          file_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lot_id?: string
          nom?: string
          is_required?: boolean
          allow_multiple?: boolean
          file_url?: string | null
          file_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      lot_document_files: {
        Row: {
          id: string
          lot_document_id: string
          file_url: string
          file_name: string
          created_at: string
        }
        Insert: {
          id?: string
          lot_document_id: string
          file_url: string
          file_name: string
          created_at?: string
        }
        Update: {
          id?: string
          lot_document_id?: string
          file_url?: string
          file_name?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lot_document_files_lot_document_id_fkey"
            columns: ["lot_document_id"]
            isOneToOne: false
            referencedRelation: "lot_documents"
            referencedColumns: ["id"]
          },
        ]
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
          destination: 'chantier' | 'depot'
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
          destination?: 'chantier' | 'depot'
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
          destination?: 'chantier' | 'depot'
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
          chantier_id: string | null
          description: string
          quantite: number
          montant_unitaire: number | null
          is_depot: boolean
          livraison_id: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          chantier_id?: string | null
          description: string
          quantite?: number
          montant_unitaire?: number | null
          is_depot?: boolean
          livraison_id?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          chantier_id?: string | null
          description?: string
          quantite?: number
          montant_unitaire?: number | null
          is_depot?: boolean
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
          lot_id: string | null
          designation: string
          quantite: number
          source: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          chantier_id: string
          plot_id?: string | null
          etage_id?: string | null
          lot_id?: string | null
          designation: string
          quantite?: number
          source?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          chantier_id?: string
          plot_id?: string | null
          etage_id?: string | null
          lot_id?: string | null
          designation?: string
          quantite?: number
          source?: string | null
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
      depot_articles: {
        Row: {
          id: string
          designation: string
          quantite: number
          valeur_totale: number
          unite: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          designation: string
          quantite?: number
          valeur_totale?: number
          unite?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          designation?: string
          quantite?: number
          valeur_totale?: number
          unite?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      depot_mouvements: {
        Row: {
          id: string
          article_id: string
          type: 'entree' | 'sortie' | 'transfert_chantier'
          quantite: number
          prix_unitaire: number
          montant_total: number
          livraison_id: string | null
          chantier_id: string | null
          note: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          article_id: string
          type: 'entree' | 'sortie' | 'transfert_chantier'
          quantite: number
          prix_unitaire: number
          montant_total: number
          livraison_id?: string | null
          chantier_id?: string | null
          note?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          article_id?: string
          type?: 'entree' | 'sortie' | 'transfert_chantier'
          quantite?: number
          prix_unitaire?: number
          montant_total?: number
          livraison_id?: string | null
          chantier_id?: string | null
          note?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      chantier_caracteristiques: {
        Row: {
          id: string
          chantier_id: string
          label: string
          valeur: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          chantier_id: string
          label: string
          valeur?: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          chantier_id?: string
          label?: string
          valeur?: string
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      memo_photos: {
        Row: {
          id: string
          memo_id: string
          photo_url: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          memo_id: string
          photo_url: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          memo_id?: string
          photo_url?: string
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      memos: {
        Row: {
          id: string
          chantier_id: string | null
          etage_id: string | null
          content: string
          created_by_email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chantier_id?: string | null
          etage_id?: string | null
          content: string
          created_by_email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chantier_id?: string | null
          etage_id?: string | null
          content?: string
          created_by_email?: string
          created_at?: string
          updated_at?: string
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
          p_variante_ids: string[]
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
      transfer_inventaire: {
        Args: {
          p_source_id: string
          p_quantity: number
          p_target_plot_id: string | null
          p_target_etage_id: string | null
          p_target_lot_id: string | null
        }
        Returns: undefined
      }
    }
    Enums: {
      chantier_type: 'complet' | 'leger'
      chantier_status: 'active' | 'termine' | 'supprime'
      task_status: 'not_started' | 'in_progress' | 'done'
      delivery_status: 'commande' | 'prevu' | 'livre'
      plinth_status: 'non_commandees' | 'commandees' | 'faconnees'
      reservation_status: 'ouvert' | 'resolu'
      livraison_destination: 'chantier' | 'depot'
      depot_mouvement_type: 'entree' | 'sortie' | 'transfert_chantier'
      activity_event_type: 'task_status_changed' | 'note_added' | 'photo_added' | 'blocking_noted' | 'besoin_added' | 'besoin_ordered' | 'besoin_updated' | 'besoin_deleted' | 'livraison_created' | 'livraison_status_changed' | 'livraison_updated' | 'livraison_deleted' | 'inventaire_added' | 'inventaire_updated' | 'reservation_created' | 'reservation_resolved' | 'depot_entree' | 'depot_sortie' | 'depot_transfert'
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

// Type miroir de la table lot_document_files (051_multi_file_documents.sql)
export interface LotDocumentFile {
  id: string
  lot_document_id: string
  file_url: string
  file_name: string
  created_at: string
}

// Type miroir de la table lot_documents (007_lots.sql + 014_lot_documents_file.sql + 051_multi_file_documents.sql)
export interface LotDocument {
  id: string
  lot_id: string
  nom: string
  is_required: boolean
  allow_multiple: boolean
  file_url: string | null
  file_name: string | null
  created_at: string
  lot_document_files?: LotDocumentFile[]
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

// Type miroir de la table inventaire (018_inventaire.sql + 026_stockage_general + 050_inventaire_lot + 060_transfer_inventaire_lot)
export interface Inventaire {
  id: string
  chantier_id: string
  plot_id: string | null
  etage_id: string | null
  lot_id: string | null
  designation: string
  quantite: number
  source: string | null
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

// Type miroir de la table depot_articles (038_depot_entreprise.sql)
export interface DepotArticle {
  id: string
  designation: string
  quantite: number
  valeur_totale: number
  unite: string | null
  created_at: string
  created_by: string | null
}

// Type miroir de la table depot_mouvements (038_depot_entreprise.sql)
export interface DepotMouvement {
  id: string
  article_id: string
  type: 'entree' | 'sortie' | 'transfert_chantier'
  quantite: number
  prix_unitaire: number
  montant_total: number
  livraison_id: string | null
  chantier_id: string | null
  note: string | null
  created_at: string
  created_by: string | null
}

// Type miroir de la table besoins (016_besoins_livraisons.sql)
export interface Besoin {
  id: string
  chantier_id: string | null
  description: string
  quantite: number
  montant_unitaire: number | null
  is_depot: boolean
  livraison_id: string | null
  created_at: string
  created_by: string | null
}

// Type miroir de la table lot_badges (046_lot_badges.sql)
export type LotBadge = Database['public']['Tables']['lot_badges']['Row']

// Type miroir de la table memos (048_chantier_memos.sql + 058_memos_multi_level.sql)
export type Memo = Database['public']['Tables']['memos']['Row']

// Type miroir de la table memo_photos (059_memo_photos.sql)
export type MemoPhoto = Database['public']['Tables']['memo_photos']['Row']

// Type miroir de la table chantier_caracteristiques (044_chantier_caracteristiques.sql)
export interface Caracteristique {
  id: string
  chantier_id: string
  label: string
  valeur: string
  position: number
  created_at: string
}

// Type miroir de la table intervenants (057_intervenants.sql)
export type Intervenant = Database['public']['Tables']['intervenants']['Row']

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
  destination: 'chantier' | 'depot'
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
