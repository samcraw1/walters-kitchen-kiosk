# Supabase Setup Guide

## Database Schema

Run these SQL commands in your Supabase SQL Editor to create the required tables:

```sql
-- Create orders table
CREATE TABLE orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_number TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  kiosk_fee DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index on order_number for faster lookups
CREATE INDEX idx_order_number ON orders(order_number);
CREATE INDEX idx_status ON orders(status);
CREATE INDEX idx_created_at ON orders(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to orders
CREATE POLICY "Allow public read" ON orders
  FOR SELECT USING (true);

-- Allow public insert
CREATE POLICY "Allow public insert" ON orders
  FOR INSERT WITH CHECK (true);

-- Update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Setup Instructions

1. Go to https://supabase.com and create a new project
2. Copy your project URL and anon key
3. In the SQL Editor, paste and run the SQL above
4. Create a `.env.local` file in the api folder:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

## Accessing Orders

You can view orders in the Supabase Dashboard under the "orders" table, or query them programmatically through the API.
