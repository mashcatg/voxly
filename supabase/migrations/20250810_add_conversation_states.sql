-- Add states column to conversations table
ALTER TABLE conversations
ADD COLUMN states JSONB DEFAULT NULL;

-- Update RLS policy for states
CREATE POLICY "Users can update states of own conversations" ON conversations
  FOR UPDATE USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);
