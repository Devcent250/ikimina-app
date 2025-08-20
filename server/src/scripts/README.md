# President User Creation Scripts

This directory contains scripts to help you create new users who are presidents in the system.

## Overview

The system has two main entities:
- **User**: System users who can log into the application
- **Member**: Group members who can be assigned as group officers (president, accountant, secretary)

When creating a president user, the script will:
1. Create a Member record (if it doesn't exist)
2. Create a User record with the "president" role
3. Optionally assign the member as president of a specific group

## Available Scripts

### 1. Interactive CLI Script
Run this to create a president user interactively with prompts:

```bash
npm run create:president
# or
yarn create:president
```

This will guide you through entering all the required information.

### 2. Programmatic Script
Use the `createPresidentUser` function in your own code:

```typescript
import { createPresidentUser } from "./src/scripts/createPresidentUser";

const params = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  password: "password123",
  idNumber: "ID123456789",
  gender: "Male",
  marriageStatus: "Married",
  sourceOfIncome: "Business",
  joinedAt: new Date(),
  branchId: 1,
  groupId: 1, // Optional
  roleName: "president"
};

await createPresidentUser(params);
```

### 3. Example Script
Run the example script to see it in action:

```bash
npx ts-node src/scripts/examplePresidentUser.ts
```

## Required Information

### User Details
- `firstName`: First name
- `lastName`: Last name
- `email`: Email address (must be unique)
- `password`: Password (minimum 6 characters)
- `phone`: Phone number (optional)

### Member Details
- `idNumber`: National ID number (must be unique)
- `gender`: "Male", "Female", or "Other"
- `marriageStatus`: "Single", "Married", "Divorced", or "Widowed"
- `country`: Country (optional)
- `currentAddress`: Current address (optional)
- `sourceOfIncome`: Source of income
- `joinedAt`: Date when they joined

### System Details
- `branchId`: ID of the branch they belong to
- `groupId`: ID of the group they will be president of (optional)
- `roleName`: Role name (defaults to "president")

## President Role Permissions

The president role is created with the following permissions:
- Groups: read, update
- Members: read, update
- Contributions: read, update
- Loans: read, update
- Meetings: read, update

## Prerequisites

Before running the scripts, make sure:
1. Your database is running and accessible
2. You have at least one branch created
3. If assigning as group president, the group exists in the specified branch
4. Your environment variables are properly configured

## Troubleshooting

### Common Issues

1. **Branch not found**: Make sure the branch ID exists in your database
2. **Group not found**: Ensure the group exists and belongs to the specified branch
3. **Email already exists**: Use a different email address
4. **ID number already exists**: Use a different ID number

### Error Messages

- `Branch with ID X not found`: The branch doesn't exist
- `Group with ID X not found in branch Y`: The group doesn't exist or doesn't belong to the branch
- `Role with this name already exists`: The role already exists (this is not an error, the script will use the existing role)

## Database Schema

The script works with these entities:
- `User`: System users with authentication
- `Member`: Group members with personal information
- `Role`: User roles with permissions
- `Branch`: Organizational branches
- `Group`: Groups within branches with officers

## Security Notes

- Passwords are automatically hashed using bcrypt
- The script validates all input data
- Existing records are not overwritten (it will use existing ones)
- The president role has limited permissions compared to admin 