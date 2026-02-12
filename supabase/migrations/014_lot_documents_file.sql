-- Story 5.1 : Upload, visualisation et gestion de documents PDF
-- Colonnes file_url + file_name sur lot_documents + bucket Storage privé documents

-- =====================
-- COLONNES fichier sur lot_documents
-- =====================
ALTER TABLE public.lot_documents ADD COLUMN file_url TEXT DEFAULT NULL;
ALTER TABLE public.lot_documents ADD COLUMN file_name TEXT DEFAULT NULL;

-- =====================
-- BUCKET STORAGE documents (privé — accès via signed URLs)
-- =====================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- RLS POLICIES — storage.objects pour documents
-- =====================

-- authenticated peut upload
CREATE POLICY "authenticated_upload_documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

-- authenticated peut lire
CREATE POLICY "authenticated_read_documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

-- authenticated peut supprimer ses propres fichiers
CREATE POLICY "authenticated_delete_documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- NOTE: RLS UPDATE sur lot_documents déjà couverte par apply_rls_policy('lot_documents')
-- qui crée une policy FOR ALL (SELECT, INSERT, UPDATE, DELETE) pour authenticated.
