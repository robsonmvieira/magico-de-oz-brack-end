CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"canonical_name" varchar(255),
	"google_id" integer,
	"country_code" varchar(10),
	"target_type" varchar(50),
	"is_deleted" boolean DEFAULT false NOT NULL
);
