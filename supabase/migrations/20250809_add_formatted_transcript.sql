-- Add formatted_transcript column
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS formatted_transcript JSONB;
