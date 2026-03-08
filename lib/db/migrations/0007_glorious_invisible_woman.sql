ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "is_video_call" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "video_call_url" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "video_call_room_name" text;