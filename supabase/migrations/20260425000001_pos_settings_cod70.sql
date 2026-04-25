-- Migration: Add POS settings table for COD-70
-- POS Settings page (G4) and POS Historique page (G6) need persistent settings

CREATE TABLE IF NOT EXISTS public.pos_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  ticket_width VARCHAR(10) NOT NULL DEFAULT '58mm' CHECK (ticket_width IN ('58mm', '80mm')),
  default_tva VARCHAR(10) NOT NULL DEFAULT '18',
  default_currency VARCHAR(10) NOT NULL DEFAULT 'CDF' CHECK (default_currency IN ('CDF', 'USD')),
  offline_mode BOOLEAN NOT NULL DEFAULT false,
  printer_name VARCHAR(100) DEFAULT 'Thermal Printer XP-58',
  printer_connected BOOLEAN DEFAULT true,
  printer_status VARCHAR(50) DEFAULT 'Prête',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pos_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_settings_all_crud" ON public.pos_settings FOR ALL TO authenticated USING (true);

-- Insert default settings
INSERT INTO public.pos_settings (id, ticket_width, default_tva, default_currency, offline_mode, printer_name)
VALUES ('default', '58mm', '18', 'CDF', false, 'Thermal Printer XP-58')
ON CONFLICT DO NOTHING;
