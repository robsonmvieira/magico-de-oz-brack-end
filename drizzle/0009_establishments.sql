CREATE TABLE "establishments" (
  "id" uuid PRIMARY KEY NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now(),
  "is_deleted" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_blocked" boolean DEFAULT false NOT NULL,
  "basic_cnpj" text NOT NULL,
  "cnpj_order" text NOT NULL,
  "cnpj_dv" text NOT NULL,
  "branch_type" text NOT NULL,
  "trade_name" text,
  "registration_status" text NOT NULL,
  "registration_status_date" text,
  "registration_status_reason" text,
  "foreign_city_name" text,
  "country_code" text,
  "activity_start_date" text,
  "main_cnae" text NOT NULL,
  "secondary_cnaes" text,
  "street_type" text,
  "street" text,
  "number" text,
  "complement" text,
  "neighborhood" text,
  "zip_code" text,
  "state" text,
  "city_code" text,
  "ddd1" text,
  "phone1" text,
  "ddd2" text,
  "phone2" text,
  "fax_ddd" text,
  "fax" text,
  "email" text,
  "special_situation" text,
  "special_situation_date" text
);
--> statement-breakpoint
CREATE INDEX "establishments_basic_cnpj_idx" ON "establishments" ("basic_cnpj");
--> statement-breakpoint
CREATE UNIQUE INDEX "establishments_full_cnpj_idx" ON "establishments" ("basic_cnpj", "cnpj_order", "cnpj_dv");
--> statement-breakpoint
CREATE INDEX "establishments_main_cnae_idx" ON "establishments" ("main_cnae");
--> statement-breakpoint
CREATE INDEX "establishments_state_idx" ON "establishments" ("state");
--> statement-breakpoint
CREATE INDEX "establishments_city_code_idx" ON "establishments" ("city_code");
--> statement-breakpoint
CREATE INDEX "establishments_registration_status_idx" ON "establishments" ("registration_status");
