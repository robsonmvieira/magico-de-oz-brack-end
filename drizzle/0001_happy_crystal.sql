CREATE TYPE "public"."company_size" AS ENUM('micro', 'small', 'medium', 'large');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('google_maps', 'apollo', 'hunter', 'linkedin', 'imported', 'manual', 'referral');--> statement-breakpoint
CREATE TYPE "public"."lead_stage" AS ENUM('new', 'contacted', 'replied', 'interested', 'meeting_scheduled', 'converted', 'lost', 'nurturing', 'discarded', 'ready');--> statement-breakpoint
CREATE TYPE "public"."lead_temperature" AS ENUM('hot', 'warm', 'cold', 'discarded');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"lead_category_id" uuid NOT NULL,
	"company_name" text NOT NULL,
	"trade_name" text,
	"phone" text,
	"email" text,
	"website" text,
	"address" jsonb,
	"size_classification" jsonb,
	"google_maps_data" jsonb,
	"cnpj_ws_data" jsonb,
	"decision_makers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enrichment_status" jsonb NOT NULL,
	"score" jsonb NOT NULL,
	"temperature" "lead_temperature" DEFAULT 'cold' NOT NULL,
	"stage" "lead_stage" DEFAULT 'new' NOT NULL,
	"source" "lead_source" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_lead_category_id_lead_categories_id_fk" FOREIGN KEY ("lead_category_id") REFERENCES "public"."lead_categories"("id") ON DELETE no action ON UPDATE no action;