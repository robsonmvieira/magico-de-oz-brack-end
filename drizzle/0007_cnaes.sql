CREATE TABLE "cnaes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cnaes_code_idx" ON "cnaes" ("code");
