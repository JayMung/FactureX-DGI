-- Migration: Add mode_paiement and session_id columns to factures table
-- Required for: POS → caisse_sessions synchronization (COD-76)
-- Tracks payment method and session on each invoice

ALTER TABLE public.factures
  ADD COLUMN IF NOT EXISTS mode_paiement VARCHAR(20) DEFAULT 'cash' CHECK (mode_paiement IN ('cash', 'card', 'mobile', 'mixte')),
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.caisse_sessions(id) ON DELETE SET NULL;

-- Index for JOIN performance on Journal de Caisse
CREATE INDEX IF NOT EXISTS idx_factures_session_id ON public.factures(session_id);
CREATE INDEX IF NOT EXISTS idx_factures_mode_paiement ON public.factures(mode_paiement);

-- Update RLS policy to allow INSERT with the new columns (already covered by existing "factures_all_crud" policy)
