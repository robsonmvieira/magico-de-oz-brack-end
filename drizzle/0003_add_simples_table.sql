CREATE TABLE "simples" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"basic_doc" text NOT NULL,
	"choose_simple_module" text,
	"date_simple_module_start" timestamp,
	"date_exclude_simple_module_start" timestamp,
	"choose_mei" text,
	"date_mei_start" timestamp,
	"date_exclude_mei_start" timestamp
);

CREATE INDEX "simples_basic_doc_idx" ON "simples" ("basic_doc");
