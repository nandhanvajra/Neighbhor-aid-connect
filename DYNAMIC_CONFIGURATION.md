# Dynamic Configuration Implementation

This document outlines the changes made to convert static parts of the Neighbor Aid Connect project to dynamic, configurable components.

## Overview

The project has been updated to use centralized configuration files that allow for easy customization of:
- API endpoints
- Service categories
- User roles
- Navigation items
- Feature descriptions
- Status and urgency configurations

## Configuration Files

### Client Configuration (`client/src/config/config.js`)

This file contains all client-side configuration including:

- **API Configuration**: Base URL for API calls
- **App Configuration**: App name and version
- **Service Categories**: Dynamic list of service categories with icons and colors
- **Urgency Levels**: Configurable urgency levels
- **Available Roles**: Dynamic list of user roles
- **Navigation Items**: Configurable navigation menu
- **Feature Cards**: Dynamic feature descriptions for the homepage
- **Dashboard Navigation**: Configurable dashboard menu items
- **Status Colors**: Dynamic color schemes for different statuses

### Server Configuration (`server/config/config.js`)

This file contains all server-side configuration including:

- **Server Configuration**: Port and other server settings
- **Database Configuration**: MongoDB connection settings
- **CORS Configuration**: Cross-origin resource sharing settings
- **JWT Configuration**: Authentication token settings
- **Service Categories**: Server-side validation of categories
- **Available Roles**: Server-side validation of roles
- **Rate Limiting**: API rate limiting configuration
- **File Upload**: File upload settings
- **Email Configuration**: Email service settings (for future use)
- **Socket.io Configuration**: Real-time communication settings

## Key Changes Made

### 1. API Endpoints
- **Before**: Hardcoded `http://localhost:3000` throughout the codebase
- **After**: Uses `config.apiBaseUrl` from environment variables

### 2. Service Categories
- **Before**: Hardcoded categories in forms and schemas
- **After**: Dynamic categories from configuration with icons and colors

### 3. User Roles
- **Before**: Hardcoded roles in UserList component
- **After**: Dynamic roles from configuration with server-side validation

### 4. Navigation
- **Before**: Static navigation items in Home component
- **After**: Dynamic navigation from configuration

### 5. Feature Cards
- **Before**: Static feature descriptions in Home component
- **After**: Dynamic features from configuration

### 6. Dashboard Navigation
- **Before**: Static dashboard menu items
- **After**: Dynamic dashboard navigation with admin-only options

### 7. Status and Urgency Colors
- **Before**: Hardcoded color schemes
- **After**: Dynamic color configurations

## Environment Variables

### Client Environment Variables
Create a `.env` file in the client directory:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=Neighbor Aid Connect
VITE_APP_VERSION=1.0.0
```

### Server Environment Variables
Create a `.env` file in the server directory:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

## Benefits of Dynamic Configuration

1. **Easy Customization**: Change app behavior without code modifications
2. **Environment Flexibility**: Different settings for development, staging, and production
3. **Maintainability**: Centralized configuration reduces code duplication
4. **Scalability**: Easy to add new categories, roles, or features
5. **Security**: Sensitive data moved to environment variables

## Usage Examples

### Adding a New Service Category

1. Update `client/src/config/config.js`:
```javascript
serviceCategories: [
  // ... existing categories
  { value: 'new-service', label: 'New Service', icon: 'NewIcon', color: 'purple' }
]
```

2. Update `server/config/config.js`:
```javascript
serviceCategories: [
  // ... existing categories
  'new-service'
]
```

### Adding a New User Role

1. Update both configuration files with the new role
2. The system will automatically include it in role selection dropdowns

### Changing App Name

1. Update `VITE_APP_NAME` in client `.env` file
2. The change will be reflected throughout the application

## Migration Notes

- All existing functionality remains the same
- Database schemas have been updated to use dynamic enums
- Backward compatibility is maintained for existing data
- New configuration options are optional and have sensible defaults

## Future Enhancements

- Admin panel for dynamic configuration management
- Database-driven configuration for real-time updates
- Configuration validation and error handling
- Configuration import/export functionality 