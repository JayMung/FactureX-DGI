-- Migration: Add email and notes fields to clients table
-- Date: 2026-04-29
-- Issue: COD-85 — FACTURESMART-01 Page Clients (CRM basique)

-- Add email field to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.email IS 'Email du client (contact principal)';
COMMENT ON COLUMN public.clients.notes IS 'Notes internes sur le client';

-- RLS policy already allows authenticated CRUD on clients table
-- No new policy needed since the column is nullable text

-- Index for email lookups (common search field)
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email) WHERE email IS NOT NULL;
