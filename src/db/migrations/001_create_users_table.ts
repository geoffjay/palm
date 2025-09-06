/**
 * Migration: Create users table
 * Created: 2024-01-01T00:00:00.000Z
 */

export const up = `
  -- Create users table for storing OAuth user information
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    given_name VARCHAR(255),
    family_name VARCHAR(255),
    picture VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
  );

  -- Create indexes for fast lookups
  CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  -- Function to update updated_at timestamp
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Create trigger to automatically update updated_at
  CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
`;

export const down = `
  -- Drop trigger first
  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  
  -- Drop function
  DROP FUNCTION IF EXISTS update_updated_at_column();
  
  -- Drop indexes
  DROP INDEX IF EXISTS idx_users_email;
  DROP INDEX IF EXISTS idx_users_google_id;
  
  -- Drop table
  DROP TABLE IF EXISTS users;
`;
