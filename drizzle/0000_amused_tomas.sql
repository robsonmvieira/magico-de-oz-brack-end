CREATE TABLE "lead_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"priority" integer NOT NULL,
	"score_bonus" integer NOT NULL,
	"keywords" text NOT NULL,
	"color" text NOT NULL
);
