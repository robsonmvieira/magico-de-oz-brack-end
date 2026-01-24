CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"basic_cnpj" text NOT NULL,
	"partner_identifier" text,
	"partner_name" text,
	"partner_doc" text,
	"partner_qualification" text,
	"entry_date" timestamp,
	"country_code" text,
	"legal_representative_doc" text,
	"legal_representative_name" text,
	"legal_representative_qualification" text,
	"age_range" text
);
--> statement-breakpoint
DROP INDEX "simples_basic_doc_idx";--> statement-breakpoint
ALTER TABLE "simples" ADD CONSTRAINT "simples_basic_doc_unique" UNIQUE("basic_doc");