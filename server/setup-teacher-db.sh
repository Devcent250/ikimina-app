#!/bin/bash

# Teacher Savings Group Database Setup Script

echo "🎓 Setting up Teacher Savings Group Database..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Create database
echo "📊 Creating ikimina database..."
createdb ikimina

if [ $? -eq 0 ]; then
    echo "✅ Database 'ikimina' created successfully"
else
    echo "❌ Failed to create database. It might already exist."
fi

# Set up environment file
echo "⚙️ Setting up environment configuration..."
if [ ! -f .env ]; then
    cp teacher.env.example .env
    echo "✅ Environment file created. Please update the database credentials."
else
    echo "ℹ️ Environment file already exists."
fi

echo ""
echo "🎯 Next steps:"
echo "1. Update the .env file with your database credentials"
echo "2. Run: npm run migration:run"
echo "3. Run: npm run dev"
echo ""
echo "📝 Database URL format:"
echo "TEACHER_DATABASE_URL=postgresql://username:password@localhost:5432/ikimina"
