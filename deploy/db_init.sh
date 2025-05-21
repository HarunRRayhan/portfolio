#!/bin/bash
# Enhanced Database Initialization Script

set -e
set -o pipefail

echo "===== Starting Database Initialization ====="

# Create a psql script file to initialize the database
cat > /tmp/init_db.sql << 'EOF'
-- Create user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'portfolio') THEN
    CREATE USER portfolio WITH PASSWORD 'password';
  ELSE
    ALTER USER portfolio WITH PASSWORD 'password';
  END IF;
END $$;

-- Create database if not exists
SELECT 'CREATE DATABASE portfolio' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'portfolio')\gexec

-- Grant privileges on database
ALTER DATABASE portfolio OWNER TO portfolio;
GRANT ALL PRIVILEGES ON DATABASE portfolio TO portfolio;

-- Connect to the portfolio database
\c portfolio postgres

-- Create cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS cache (
  key VARCHAR(255) NOT NULL PRIMARY KEY, 
  value TEXT NOT NULL, 
  expiration INTEGER NOT NULL
);

-- Create sessions table if it doesn't exist (useful for file-based sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  user_id INTEGER NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  payload TEXT NOT NULL,
  last_activity INTEGER NOT NULL
);

-- Create jobs and failed_jobs tables (to prevent errors with queue driver)
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  queue VARCHAR(255) NOT NULL,
  payload TEXT NOT NULL,
  attempts SMALLINT NOT NULL DEFAULT '0',
  reserved_at INTEGER NULL,
  available_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS failed_jobs (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(255) NOT NULL,
  connection TEXT NOT NULL,
  queue TEXT NOT NULL,
  payload TEXT NOT NULL,
  exception TEXT NOT NULL,
  failed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on failed_jobs.uuid
CREATE UNIQUE INDEX IF NOT EXISTS failed_jobs_uuid_unique ON failed_jobs (uuid);

-- Grant permissions on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO portfolio;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO portfolio;
EOF

# Check if database container is running
DB_CONTAINER=$(sudo docker ps -q -f name=docker-db-1)
if [ -z "$DB_CONTAINER" ]; then
  echo "Database container not running, starting it..."
  # Start only the database container in detached mode
  sudo docker-compose -f docker/docker-compose.yml up -d db
  
  # Wait for database to be ready
  echo "Waiting for database to initialize (15 seconds)..."
  sleep 15
else
  echo "Database container is already running"
fi

# Run the SQL script
echo "Applying database initialization script..."
DATABASE_INIT_RESULT=$(sudo docker exec -i docker-db-1 psql -U postgres -f /tmp/init_db.sql 2>&1) || true
echo "$DATABASE_INIT_RESULT"

# Verify database connection
echo "Verifying database connection..."
CONNECTION_TEST=$(sudo docker exec docker-db-1 psql -U portfolio -d portfolio -c "\dt" 2>&1) || true
if [[ $CONNECTION_TEST == *"ERROR"* ]]; then
  echo "WARNING: Database connection verification failed:"
  echo "$CONNECTION_TEST"
  echo "Will continue deployment but database issues may persist."
else
  echo "Database connection successful."
  echo "Tables in portfolio database:"
  echo "$CONNECTION_TEST"
fi

echo "===== Database Initialization Completed ====="
