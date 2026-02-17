-- Réponses apportées aux notes bloquantes
-- Story 4.6

CREATE TABLE public.note_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_note_responses_note_id ON public.note_responses(note_id);

ALTER TABLE public.note_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY note_responses_insert ON public.note_responses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY note_responses_select ON public.note_responses
  FOR SELECT TO authenticated
  USING (true);
