-- Composite index for sector (CNAE) + state search
CREATE INDEX CONCURRENTLY IF NOT EXISTS "establishments_cnae_state_idx"
ON "establishments" (substring(main_cnae, 1, 2), state);

-- Composite index for companies basic_cnpj + company_size for faster joins
CREATE INDEX CONCURRENTLY IF NOT EXISTS "companies_cnpj_size_idx"
ON "companies" (basic_cnpj, company_size);

-- Partial index for active establishments only (most common filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "establishments_active_idx"
ON "establishments" (state, main_cnae)
WHERE registration_status = '02';
