-- Walter's Kitchen Kiosk Database Schema
-- Run this in Supabase SQL Editor

-- Categories table
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  available BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kiosk settings table (for Stripe Connect, etc.)
CREATE TABLE IF NOT EXISTS kiosk_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_menu_categories_sort ON menu_categories(sort_order);

-- Enable RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for menu (kiosk needs to read)
CREATE POLICY "Public read menu_categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT USING (true);

-- Service role can do everything (API uses service key)
CREATE POLICY "Service write menu_categories" ON menu_categories FOR ALL USING (true);
CREATE POLICY "Service write menu_items" ON menu_items FOR ALL USING (true);
CREATE POLICY "Service all kiosk_settings" ON kiosk_settings FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS menu_categories_updated_at ON menu_categories;
CREATE TRIGGER menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS menu_items_updated_at ON menu_items;
CREATE TRIGGER menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS kiosk_settings_updated_at ON kiosk_settings;
CREATE TRIGGER kiosk_settings_updated_at
  BEFORE UPDATE ON kiosk_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
