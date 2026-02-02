-- Enable pg_trgm extension for trigram similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index on company_name for fast ILIKE searches
CREATE INDEX idx_companies_name_trgm ON companies USING GIN(company_name gin_trgm_ops);

-- Also create trigram index on trade_name in establishments for searching by trade name
CREATE INDEX idx_establishments_trade_name_trgm ON establishments USING GIN(trade_name gin_trgm_ops);
