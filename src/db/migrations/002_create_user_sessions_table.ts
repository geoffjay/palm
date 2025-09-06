/**
 * Migration: Create user sessions table
 * Created: 2024-01-01T00:00:00.001Z
 */

export const up = `
  -- Create sessions table for storing session metadata (optional, since we use Redis)
  CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_agent TEXT,
    ip_address INET,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes for fast lookups
  CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

  -- Function to update last_activity timestamp
  CREATE OR REPLACE FUNCTION update_session_activity()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.last_activity = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Create trigger to automatically update last_activity
  CREATE TRIGGER update_user_sessions_activity 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_session_activity();
`;

export const down = `
  -- Drop trigger first
  DROP TRIGGER IF EXISTS update_user_sessions_activity ON user_sessions;
  
  -- Drop function
  DROP FUNCTION IF EXISTS update_session_activity();
  
  -- Drop indexes
  DROP INDEX IF EXISTS idx_user_sessions_last_activity;
  DROP INDEX IF EXISTS idx_user_sessions_expires_at;
  DROP INDEX IF EXISTS idx_user_sessions_user_id;
  DROP INDEX IF EXISTS idx_user_sessions_session_id;
  
  -- Drop table
  DROP TABLE IF EXISTS user_sessions;
`;
