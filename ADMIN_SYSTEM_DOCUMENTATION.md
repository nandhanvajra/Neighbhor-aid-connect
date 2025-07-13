# Admin System Documentation

## Overview

The Neighbor Aid Connect platform now includes a comprehensive admin system that allows administrators to monitor, manage, and oversee all user activities. This system provides secure access control, detailed activity logging, and powerful management tools.

## Key Features

### 🔐 Secure Admin Access
- **Protected Admin Creation**: Admins can only be created through a secure API endpoint with a secret key
- **Role-Based Authorization**: Admin middleware ensures only authorized users can access admin features
- **Activity Logging**: All admin actions are logged for audit purposes

### 📊 Comprehensive Monitoring
- **Real-time Dashboard**: Overview of system statistics and recent activities
- **User Management**: View, edit, and manage all user accounts
- **Activity Tracking**: Monitor all user actions and system events
- **Request Oversight**: Track and manage service requests

### 🛠️ Management Tools
- **User Role Management**: Assign and modify user roles
- **Account Status Control**: Enable/disable user accounts
- **User Deletion**: Remove users with proper cleanup
- **Activity Filtering**: Search and filter activities by various criteria

## Admin Creation

### Method 1: API Endpoint (Recommended)
Use the secure admin creation endpoint:

```bash
POST /api/auth/create-admin
Content-Type: application/json

{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "securepassword",
  "address": "Admin Address",
  "job": "System Administrator",
  "adminSecret": "adminSecretKey2024"
}
```

**Important**: Change the `ADMIN_SECRET` in `server/routes/authRoutes.js` to a secure value.

### Method 2: Database Direct Update
```javascript
// In MongoDB shell or MongoDB Compass
db.users.updateOne(
  { email: "user@example.com" },
  { 
    $set: { 
      isAdmin: true, 
      role: "admin" 
    } 
  }
)
```

## Admin Dashboard Features

### 1. Overview Tab
- **System Statistics**: Total users, requests, messages, and chats
- **User Distribution**: Breakdown by role
- **Request Status**: Distribution by status
- **Recent Activities**: Latest user actions
- **Top Users**: Most active users

### 2. Users Tab
- **User List**: Paginated list of all users
- **Search & Filter**: Find users by name, email, or role
- **Role Management**: Change user roles dynamically
- **Status Control**: Enable/disable user accounts
- **User Deletion**: Remove users (with safeguards)

### 3. Activities Tab
- **Activity Log**: Complete audit trail of user actions
- **Action Types**: Login, signup, requests, admin actions
- **Filtering**: Filter by action type, user, date range
- **Details**: View detailed information about each action

### 4. Requests Tab
- **Request Overview**: All service requests in the system
- **Status Tracking**: Monitor request progress
- **User Information**: See who created and completed requests
- **Filtering**: Filter by status, category, urgency

## API Endpoints

### Admin Dashboard
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get users with pagination and filters
- `GET /api/admin/activities` - Get activities with pagination and filters
- `GET /api/admin/requests` - Get requests with pagination and filters

### User Management
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/status` - Enable/disable user
- `DELETE /api/admin/users/:id` - Delete user

### Reports
- `GET /api/admin/reports?type=user_activity` - User activity reports
- `GET /api/admin/reports?type=request_analytics` - Request analytics
- `GET /api/admin/reports?type=user_registration` - Registration trends

## Activity Logging

### Tracked Actions
- `login` - User login events
- `logout` - User logout events
- `signup` - New user registration
- `create_request` - Service request creation
- `update_request` - Request modifications
- `delete_request` - Request deletion
- `offer_help` - Users offering to help
- `complete_request` - Request completion
- `rate_service` - Service ratings
- `update_profile` - Profile updates
- `send_message` - Message sending
- `role_change` - Role modifications
- `admin_action` - Admin-specific actions

### Activity Details
Each activity log includes:
- User information (ID, name, email)
- Action type and details
- Timestamp
- IP address and user agent
- Status (success/failed/pending)

## Security Features

### Admin Authorization Middleware
```javascript
const { adminAuth } = require('../middleware/auth');

// Apply to admin routes
router.use(adminAuth);
```

### Safeguards
- **Self-Deletion Prevention**: Admins cannot delete their own accounts
- **Admin Protection**: Other admins cannot be deleted
- **Role Validation**: Only valid roles can be assigned
- **Activity Logging**: All admin actions are logged

## Database Schema

### Activity Schema
```javascript
{
  userId: ObjectId,
  userName: String,
  userEmail: String,
  action: String,
  details: Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: Date,
  status: String
}
```

### User Schema Updates
- `isAdmin: Boolean` - Admin flag
- `role: String` - User role (includes 'admin')
- `isActive: Boolean` - Account status

## Configuration

### Server Configuration
Add to `server/config/config.js`:
```javascript
availableRoles: [
  'admin',
  'resident',
  'volunteer',
  // ... other roles
]
```

### Client Configuration
Add to `client/src/config/config.js`:
```javascript
dashboardNavItems: [
  // ... existing items
  { id: 'admin', label: 'Admin Dashboard', icon: 'Shield', adminOnly: true }
]
```

## Usage Instructions

### For Administrators

1. **Access Admin Dashboard**:
   - Log in with admin credentials
   - Navigate to "Admin Dashboard" in the sidebar
   - View system overview and statistics

2. **Manage Users**:
   - Go to "Users" tab
   - Search for specific users
   - Modify roles, enable/disable accounts
   - Delete users when necessary

3. **Monitor Activities**:
   - Go to "Activities" tab
   - Filter by action type or user
   - Review detailed activity logs

4. **Track Requests**:
   - Go to "Requests" tab
   - Monitor service request status
   - View request details and participants

### For Developers

1. **Add Activity Logging**:
```javascript
const Activity = require('../models/activitySchema');

await Activity.logActivity({
  userId: user._id,
  userName: user.name,
  userEmail: user.email,
  action: 'custom_action',
  details: { /* action details */ },
  ipAddress: req.ip,
  userAgent: req.get('User-Agent')
});
```

2. **Protect Admin Routes**:
```javascript
const { adminAuth } = require('../middleware/auth');
router.use(adminAuth);
```

3. **Add Admin Features**:
   - Create new admin routes in `server/routes/adminRoutes.js`
   - Add corresponding frontend components
   - Update navigation configuration

## Best Practices

### Security
- Change the admin secret key regularly
- Use strong passwords for admin accounts
- Monitor admin activity logs
- Implement rate limiting for admin endpoints

### Monitoring
- Regularly review activity logs
- Monitor for suspicious activities
- Track user registration trends
- Analyze request patterns

### Maintenance
- Clean up old activity logs periodically
- Backup admin configurations
- Update admin permissions as needed
- Document admin procedures

## Troubleshooting

### Common Issues

1. **Admin Access Denied**:
   - Verify user has `isAdmin: true` and `role: 'admin'`
   - Check admin middleware is properly applied
   - Ensure valid JWT token

2. **Activity Logging Errors**:
   - Check MongoDB connection
   - Verify Activity model is imported
   - Check for required fields in activity data

3. **Dashboard Not Loading**:
   - Verify admin routes are registered
   - Check API endpoints are accessible
   - Review browser console for errors

### Debug Mode
Enable debug logging in admin routes:
```javascript
console.log('Admin action:', { userId, action, details });
```

## Future Enhancements

### Planned Features
- **Advanced Analytics**: Charts and graphs for data visualization
- **Bulk Operations**: Mass user management
- **Export Functionality**: Export reports and data
- **Notification System**: Admin alerts for important events
- **Audit Reports**: Comprehensive audit trail reports

### Integration Possibilities
- **Email Notifications**: Admin alerts via email
- **SMS Alerts**: Critical system notifications
- **Third-party Analytics**: Integration with external analytics tools
- **Backup Systems**: Automated data backup and recovery

## Support

For technical support or questions about the admin system:
1. Check the activity logs for error details
2. Review the server logs for backend issues
3. Verify database connections and permissions
4. Test admin endpoints with Postman or similar tools

---

**Note**: This admin system is designed for authorized personnel only. Always follow security best practices and maintain proper access controls. 