-- Add analysis fields to conversations table
ALTER TABLE conversations
  ADD COLUMN summary TEXT,
  ADD COLUMN structured_data JSONB,
  ADD COLUMN success_evaluation JSONB;
