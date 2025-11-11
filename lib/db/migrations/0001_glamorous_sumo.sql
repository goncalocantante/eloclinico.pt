CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"email" varchar(255) NOT NULL,
	"phone" varchar(16),
	"position" varchar(64) NOT NULL,
	"address" varchar(100),
	"information" text,
	"dateOfBirth" date,
	CONSTRAINT "patients_email_unique" UNIQUE("email"),
	CONSTRAINT "patients_position_unique" UNIQUE("position")
);
