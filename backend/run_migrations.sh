#!/bin/bash
# Script to run migrations manually via psql

DB_URL="postgres://arff_user:arff_pass@localhost:5432/arff_db"

echo "Resetting database..."
psql "$DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "Running migrations..."
for file in migrations/*.sql; do
    echo "Applying $file..."
    psql "$DB_URL" -f "$file"
    if [ $? -ne 0 ]; then
        echo "Error applying $file"
        exit 1
    fi
done

echo "Database reset and migrations applied successfully!"
