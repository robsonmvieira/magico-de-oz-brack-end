-- Add Full Text Search columns and indexes for fast text search

-- Add tsvector column to companies for company_name search
ALTER TABLE companies ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(company_name, ''))) STORED;

-- Add tsvector column to establishments for trade_name search
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(trade_name, ''))) STORED;

-- Create GIN indexes on the tsvector columns
CREATE INDEX IF NOT EXISTS idx_companies_search_vector ON companies USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_establishments_search_vector ON establishments USING GIN(search_vector);
