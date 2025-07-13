# Admin User Creation API Documentation

This document provides instructions for creating admin users using Postman or any HTTP client.

## Base URL
```
http://localhost:3000/api/auth
```

## Endpoints

### 1. Create Admin User
**POST** `/create-admin`

Creates a new admin user with elevated privileges.

#### Headers
```
Content-Type: application/json
```

#### Request Body (JSON)
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "adminpassword123",
  "address": "123 Admin Street, City, State",
  "job": "System Administrator",
  "adminSecret": "adminSecretKey2024",
  "phone": "+1234567890",
  "bio": "System administrator with full access",
  "skills": ["System Management", "User Management", "Security"],
  "gender": "prefer-not-to-say",
  "occupation": "IT Administrator"
}
```

#### Required Fields
- `name` (string): Full name of the admin user
- `email` (string): Unique email address
- `password` (string): Password (minimum 4 characters)
- `address` (string): Physical address
- `job` (string): Job title or role
- `adminSecret` (string): Secret key to authorize admin creation

#### Optional Fields
- `phone` (string): Phone number
- `bio` (string): Biography (max 500 characters)
- `skills` (array): Array of skill strings
- `profilePicture` (string): URL to profile picture
- `dateOfBirth` (date): Date of birth
- `gender` (string): One of ['male', 'female', 'other', 'prefer-not-to-say']
- `occupation` (string): Occupation
- `emergencyContact` (object): Emergency contact information
- `preferences` (object): User preferences

#### Success Response (201 Created)
```json
{
  "message": "Admin user created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Admin User",
    "email": "admin@example.com",
    "address": "123 Admin Street, City, State",
    "job": "System Administrator",
    "isAdmin": true,
    "role": "admin",
    "phone": "+1234567890",
    "bio": "System administrator with full access",
    "skills": ["System Management", "User Management", "Security"],
    "gender": "prefer-not-to-say",
    "occupation": "IT Administrator",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

**400 Bad Request - Missing Fields**
```json
{
  "message": "Missing required fields: name, email, password, address, job",
  "error": "MISSING_REQUIRED_FIELDS"
}
```

**400 Bad Request - User Exists**
```json
{
  "message": "User with this email already exists",
  "error": "USER_ALREADY_EXISTS"
}
```

**403 Forbidden - Invalid Secret**
```json
{
  "message": "Unauthorized: Invalid admin secret key",
  "error": "ADMIN_SECRET_MISMATCH"
}
```

**500 Internal Server Error**
```json
{
  "message": "Admin creation failed",
  "error": "Error details..."
}
```

### 2. List All Admin Users
**GET** `/admins`

Retrieves a list of all admin users in the system.

#### Headers
```
Content-Type: application/json
```

#### Success Response (200 OK)
```json
{
  "message": "Admin users retrieved successfully",
  "count": 2,
  "admins": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "isAdmin": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Super Admin",
      "email": "superadmin@example.com",
      "role": "admin",
      "isAdmin": true,
      "createdAt": "2024-01-14T15:45:00.000Z"
    }
  ]
}
```

## Postman Setup Instructions

### 1. Create Admin User Request

1. **Open Postman**
2. **Create a new request**
3. **Set method to POST**
4. **Set URL to**: `http://localhost:3000/api/auth/create-admin`
5. **Go to Headers tab**:
   - Key: `Content-Type`
   - Value: `application/json`
6. **Go to Body tab**:
   - Select `raw`
   - Select `JSON` from dropdown
   - Paste the JSON body:

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "adminpassword123",
  "address": "123 Admin Street, City, State",
  "job": "System Administrator",
  "adminSecret": "adminSecretKey2024",
  "phone": "+1234567890",
  "bio": "System administrator with full access",
  "skills": ["System Management", "User Management", "Security"],
  "gender": "prefer-not-to-say",
  "occupation": "IT Administrator"
}
```

7. **Click Send**

### 2. List Admin Users Request

1. **Create a new request**
2. **Set method to GET**
3. **Set URL to**: `http://localhost:3000/api/auth/admins`
4. **Click Send**

## Security Notes

### Admin Secret Key
The `adminSecret` key is currently set to: `adminSecretKey2024`

**⚠️ IMPORTANT**: Change this secret key in production by modifying the `ADMIN_SECRET` constant in `server/routes/authRoutes.js`.

### Recommended Security Practices

1. **Change the admin secret key** to a strong, unique value
2. **Use environment variables** for sensitive keys
3. **Limit access** to admin creation endpoints
4. **Monitor admin user creation** in logs
5. **Use HTTPS** in production

## Environment Variables Setup

For better security, you can use environment variables:

1. **Create a `.env` file** in the server directory:
```env
ADMIN_SECRET=your_very_secure_admin_secret_key_here
JWT_SECRET=your_very_secure_jwt_secret_key_here
```

2. **Update the auth routes** to use environment variables:
```javascript
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'adminSecretKey2024';
const jwtSecret = process.env.JWT_SECRET || 'superSecretHardcodedKey123';
```

## Testing Examples

### Minimal Admin Creation
```json
{
  "name": "Test Admin",
  "email": "testadmin@example.com",
  "password": "test123",
  "address": "Test Address",
  "job": "Test Job",
  "adminSecret": "adminSecretKey2024"
}
```

### Full Admin Creation
```json
{
  "name": "Full Admin User",
  "email": "fulladmin@example.com",
  "password": "securepassword123",
  "address": "456 Admin Avenue, Metropolis, State",
  "job": "Senior System Administrator",
  "adminSecret": "adminSecretKey2024",
  "phone": "+1987654321",
  "bio": "Experienced system administrator with 10+ years in IT management and security.",
  "skills": ["System Administration", "Network Security", "Database Management", "User Management"],
  "gender": "prefer-not-to-say",
  "occupation": "IT Director",
  "emergencyContact": {
    "name": "Emergency Contact",
    "phone": "+1111111111",
    "relationship": "Spouse"
  },
  "preferences": {
    "notifications": true,
    "emailUpdates": true,
    "publicProfile": false
  }
}
```

## Troubleshooting

### Common Issues

1. **"Unauthorized: Invalid admin secret key"**
   - Check that `adminSecret` matches the value in the server code
   - Ensure the secret key is exactly: `adminSecretKey2024`

2. **"User with this email already exists"**
   - Use a different email address
   - Or delete the existing user from the database

3. **"Missing required fields"**
   - Ensure all required fields are provided
   - Check JSON syntax for errors

4. **Server not running**
   - Start the server with: `npm start` or `node server/index.js`
   - Check that the server is running on port 3000

### Logs
Check the server console for detailed error messages and success confirmations. 