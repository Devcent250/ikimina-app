@echo off
REM Teacher Savings Group Database Setup Script for Windows

echo 🎓 Setting up Teacher Savings Group Database...

REM Check if PostgreSQL is running
pg_isready >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not running. Please start PostgreSQL first.
    pause
    exit /b 1
)

REM Create database
echo 📊 Creating ikimina database...
createdb ikimina

if %errorlevel% equ 0 (
    echo ✅ Database 'ikimina' created successfully
) else (
    echo ❌ Failed to create database. It might already exist.
)

REM Set up environment file
echo ⚙️ Setting up environment configuration...
if not exist .env (
    copy teacher.env.example .env
    echo ✅ Environment file created. Please update the database credentials.
) else (
    echo ℹ️ Environment file already exists.
)

echo.
echo 🎯 Next steps:
echo 1. Update the .env file with your database credentials
echo 2. Run: npm run migration:run
echo 3. Run: npm run dev
echo.
echo 📝 Database URL format:
echo TEACHER_DATABASE_URL=postgresql://username:password@localhost:5432/ikimina
echo.
pause
