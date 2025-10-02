# 🎓 Teacher Savings Group Management System

A specialized savings group management system designed for teachers to manage their collective savings, loans, and financial activities.

## 🚀 Quick Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Database Setup

#### Windows:
```bash
# Run the setup script
setup-teacher-db.bat
```

#### Linux/Mac:
```bash
# Make script executable and run
chmod +x setup-teacher-db.sh
./setup-teacher-db.sh
```

#### Manual Setup:
```bash
# Create database
createdb teacher_savings_db

# Copy environment file
cp teacher.env.example .env
```

### 2. Environment Configuration

Update the `.env` file with your database credentials:

```env
TEACHER_DATABASE_URL=postgresql://username:password@localhost:5432/ikimina
NODE_ENV=development
PORT=5001
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Install Dependencies

```bash
# Install dependencies
npm install

# Or if using the teacher-specific package.json
npm install --package-lock-only
```

### 4. Run Migrations

```bash
# Generate initial migration
npm run migration:generate InitialMigration

# Run migrations
npm run migration:run
```

### 5. Start Development Server

```bash
# Start the server
npm run dev
```

The server will run on `http://localhost:5001`

## 📊 Database Schema

### Core Entities

- **School**: School information and details
- **Teacher**: Teacher profiles with salary and teaching information
- **TeacherGroup**: Savings group for teachers
- **TeacherContribution**: Salary-based monthly contributions
- **TeacherLoan**: Loans given to teachers
- **TeacherFine**: Fines for missed payments/meetings
- **TeacherExpense**: Group expenses
- **TeacherAttendance**: Meeting attendance tracking

### Key Features

- **Salary-Based Contributions**: Teachers contribute a percentage of their monthly salary
- **School Integration**: Teachers are linked to their schools
- **Teaching Information**: Subject, grade level, experience tracking
- **Flexible Loan System**: Loans based on contribution history and salary
- **Meeting Management**: Attendance tracking and meeting scheduling
- **Financial Reporting**: Comprehensive reports for group finances

## 🎯 Teacher-Specific Features

### Salary Management
- Monthly salary tracking
- Percentage-based contribution calculation
- Salary history and changes

### Teaching Context
- Subject and grade level tracking
- Years of experience
- Employment type and status

### Group Management
- School-based teacher groups
- Teacher-elected leadership (Chairperson, Treasurer, Secretary)
- Meeting scheduling and attendance

### Financial Operations
- Salary-based contribution calculations
- Loan eligibility based on salary and contribution history
- Fine management for missed payments
- Expense tracking for group activities

## 🔧 Development

### Project Structure
```
server/
├── src/
│   ├── entities/teacher/     # Teacher-specific entities
│   ├── controllers/          # API controllers
│   ├── routes/              # API routes
│   ├── middleware/          # Express middleware
│   ├── database/            # Migrations and seeds
│   └── teacher-index.ts     # Main server file
├── teacher-data-source.ts   # Database configuration
└── package-teacher.json     # Teacher project dependencies
```

### Available Scripts

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run migration:generate <name>  # Generate migration
npm run migration:run    # Run pending migrations
npm run migration:revert # Revert last migration
npm run db:seed         # Seed initial data
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Teacher login
- `POST /api/auth/register` - Teacher registration
- `POST /api/auth/logout` - Logout

### Schools
- `GET /api/schools` - List schools
- `POST /api/schools` - Create school
- `PUT /api/schools/:id` - Update school

### Teachers
- `GET /api/teachers` - List teachers
- `POST /api/teachers` - Register teacher
- `PUT /api/teachers/:id` - Update teacher profile
- `GET /api/teachers/:id/contributions` - Teacher contributions

### Teacher Groups
- `GET /api/teacher-groups` - List groups
- `POST /api/teacher-groups` - Create group
- `PUT /api/teacher-groups/:id` - Update group

### Contributions
- `GET /api/contributions` - List contributions
- `POST /api/contributions` - Record contribution
- `PUT /api/contributions/:id` - Update contribution

## 🎨 Frontend Integration

The frontend can be customized to use teacher-specific terminology:

- **Members** → **Teachers**
- **Groups** → **Teacher Savings Groups**
- **Branches** → **Schools**
- **Contributions** → **Salary Contributions**

## 📈 Future Enhancements

- Mobile app for teachers
- Integration with school payroll systems
- Advanced analytics and reporting
- Multi-school support
- Teacher performance tracking
- Automated salary updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
