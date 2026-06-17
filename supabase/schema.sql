-- Bill Karo Supabase Schema

-- Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  restaurant_name TEXT NOT NULL,
  logo TEXT,
  gst_number TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  upi_id TEXT,
  tax_percentage DECIMAL DEFAULT 5.0,
  service_charge_percentage DECIMAL DEFAULT 0.0,
  currency TEXT DEFAULT 'INR',
  invoice_prefix TEXT DEFAULT 'INV',
  receipt_message TEXT DEFAULT 'Thank you!',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  name TEXT NOT NULL
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  tax DECIMAL DEFAULT 0.0,
  image TEXT,
  sku TEXT,
  availability BOOLEAN DEFAULT TRUE
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  customer_name TEXT,
  customer_mobile TEXT,
  invoice_number TEXT NOT NULL,
  order_type TEXT,
  table_number TEXT,
  subtotal DECIMAL NOT NULL,
  tax_amount DECIMAL DEFAULT 0.0,
  service_charge_amount DECIMAL DEFAULT 0.0,
  discount_amount DECIMAL DEFAULT 0.0,
  total DECIMAL NOT NULL,
  status TEXT DEFAULT 'Paid',
  items JSONB DEFAULT '[]'::jsonb,
  receipt_url TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Customer and Invoice Items details can be serialized in `items JSONB` for a simpler POS implementation.

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- User Access Table for Admin Controls
CREATE TABLE IF NOT EXISTS user_access (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  service_end_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if needed (useful during active dev)
DROP POLICY IF EXISTS "Owners can view own restaurants" ON restaurants;
DROP POLICY IF EXISTS "Owners can update own restaurants" ON restaurants;
DROP POLICY IF EXISTS "user_read_access" ON user_access;
DROP POLICY IF EXISTS "user_insert_access" ON user_access;
DROP POLICY IF EXISTS "admin_all_access" ON user_access;
DROP POLICY IF EXISTS "admin_view_invoices" ON invoices;
DROP POLICY IF EXISTS "admin_view_restaurants" ON restaurants;

DROP POLICY IF EXISTS "user_restaurant_all" ON restaurants;
DROP POLICY IF EXISTS "user_categories_all" ON categories;
DROP POLICY IF EXISTS "user_products_all" ON products;
DROP POLICY IF EXISTS "user_invoices_all" ON invoices;

-- Strict User-Specific Policies
CREATE POLICY "user_restaurant_all" ON restaurants FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "user_categories_all" ON categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_products_all" ON products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_invoices_all" ON invoices FOR ALL USING (auth.uid() = user_id);

-- User Access Policies
CREATE POLICY "user_read_access" ON user_access FOR SELECT USING (
  auth.uid() = user_id OR auth.jwt() ->> 'email' IN ('reelywood@gmail.com', 'rohan00as@gmail.com')
);

CREATE POLICY "user_insert_access" ON user_access FOR INSERT WITH CHECK (
  auth.uid() = user_id OR auth.jwt() ->> 'email' IN ('reelywood@gmail.com', 'rohan00as@gmail.com')
);

CREATE POLICY "admin_all_access" ON user_access FOR ALL USING (
  auth.jwt() ->> 'email' IN ('reelywood@gmail.com', 'rohan00as@gmail.com')
);

-- Admin read privileges on data
CREATE POLICY "admin_view_invoices" ON invoices FOR SELECT USING (auth.jwt() ->> 'email' IN ('reelywood@gmail.com', 'rohan00as@gmail.com'));
CREATE POLICY "admin_view_restaurants" ON restaurants FOR SELECT USING (auth.jwt() ->> 'email' IN ('reelywood@gmail.com', 'rohan00as@gmail.com'));

-- Store Settings
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID DEFAULT auth.uid() PRIMARY KEY,
  store_name TEXT DEFAULT 'My Store',
  address TEXT,
  phone TEXT,
  gst_number TEXT,
  footer_message TEXT DEFAULT 'Thank you for visiting!'
);

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own store settings" ON store_settings FOR ALL USING (auth.uid() = id);

-- Storage for Invoices
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoices', 'invoices', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'invoices');
CREATE POLICY "Authenticated users can upload invoices" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'invoices' AND auth.role() = 'authenticated');

-- Public invoice access for receipts
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS receipt_url TEXT;
DROP POLICY IF EXISTS "Allow public read access for receipts" ON invoices;
CREATE POLICY "Allow public read access for receipts" ON invoices FOR SELECT USING (true);


