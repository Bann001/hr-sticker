-- Product stickers generator schema

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  distributor TEXT NOT NULL,
  volume TEXT NOT NULL,
  logo_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_code TEXT NOT NULL,
  start_serial INTEGER NOT NULL,
  end_serial INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  layout_config JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for lookups
CREATE INDEX idx_batches_product ON batches(product_id);
CREATE INDEX idx_batches_code ON batches(batch_code);

-- Enable Row Level Security (optional — disable if not needed)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (adjust for production)
CREATE POLICY "Public access" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON batches FOR ALL USING (true) WITH CHECK (true);
