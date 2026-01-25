CREATE TABLE "companies" (
  "id" uuid PRIMARY KEY NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now(),
  "is_deleted" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_blocked" boolean DEFAULT false NOT NULL,
  "basic_cnpj" text NOT NULL,
  "company_name" text NOT NULL,
  "legal_nature_code" text NOT NULL,
  "responsible_qualification" text NOT NULL,
  "social_capital" text NOT NULL,
  "company_size" text NOT NULL,
  "federative_entity" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "companies_basic_cnpj_idx" ON "companies" ("basic_cnpj");
--> statement-breakpoint
CREATE INDEX "companies_legal_nature_code_idx" ON "companies" ("legal_nature_code");
--> statement-breakpoint
CREATE INDEX "companies_company_size_idx" ON "companies" ("company_size");
