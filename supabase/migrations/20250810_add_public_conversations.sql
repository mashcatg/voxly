-- Add is_public column to conversations table
ALTER TABLE conversations
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Create policy for users to view public conversations
CREATE POLICY "Anyone can view public conversations" ON conversations
  FOR SELECT USING (is_public = TRUE);

-- Update existing select policy for conversations to include public conversations
DROP POLICY "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own or public conversations" ON conversations
  FOR SELECT USING (
    auth.uid()::uuid = user_id 
    OR 
    is_public = TRUE
  );
