-- Bill Karo Supabase Schema

-- Restaurants
CREATE TABLE restaurants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
  receipt_message TEXT DEFAULT 'Thank you for visiting!',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- Products
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  tax DECIMAL DEFAULT 0.0,
  image TEXT,
  sku TEXT,
  availability BOOLEAN DEFAULT TRUE
);

-- Customers
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mobile TEXT
);

-- Invoices
CREATE TABLE invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  invoice_number TEXT NOT NULL,
  order_type TEXT,
  table_number TEXT,
  subtotal DECIMAL NOT NULL,
  tax_amount DECIMAL DEFAULT 0.0,
  service_charge_amount DECIMAL DEFAULT 0.0,
  discount_amount DECIMAL DEFAULT 0.0,
  total DECIMAL NOT NULL,
  status TEXT DEFAULT 'Paid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE invoice_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL NOT NULL
);

-- RLS Policies
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own restaurants" ON restaurants FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can update own restaurants" ON restaurants FOR UPDATE USING (auth.uid() = owner_id);
-- ... Add appropriate policies for other tables checking restaurant ownership
