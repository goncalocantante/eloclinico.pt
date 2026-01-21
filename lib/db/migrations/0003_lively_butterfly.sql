ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "user_id" uuid;
DO $$ BEGIN
 ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;