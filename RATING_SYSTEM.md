# Rating System Implementation

## Overview

The Neighbor Aid Connect application now includes a comprehensive rating system that allows users to rate and review helpers after completing service requests. This system provides detailed feedback, rating analytics, and helps build trust within the community.

## Features

### 1. Enhanced Rating Submission
- **Star Ratings**: 1-5 star rating system
- **Detailed Reviews**: Text reviews up to 500 characters
- **Additional Criteria**: Quality of work, communication, and professionalism ratings
- **Anonymous Ratings**: Option to submit ratings anonymously
- **Response Time Tracking**: Automatic calculation of response time

### 2. Rating Display & Analytics
- **Rating Statistics**: Average ratings, total count, and breakdown by star level
- **Visual Charts**: Progress bars showing rating distribution
- **Rating History**: Complete history of all ratings received
- **Filtering & Sorting**: Filter by rating level, sort by date, rating, or helpfulness

### 3. User Experience
- **Immediate Rating**: Rating modal appears after marking requests as completed
- **Rating Notifications**: Real-time notifications when users receive new ratings
- **Helpful Votes**: Users can mark ratings as helpful
- **Rating Management**: Users can edit or delete their own ratings

## Database Schema

### Rating Model (`ratingSchema.js`)
```javascript
{
  requestId: ObjectId,        // Reference to the service request
  raterId: ObjectId,          // User who submitted the rating
  ratedUserId: ObjectId,      // User being rated
  stars: Number,              // 1-5 star rating
  review: String,             // Text review (optional)
  category: String,           // Service category
  qualityOfWork: Number,      // Quality rating (optional)
  communication: Number,      // Communication rating (optional)
  professionalism: Number,    // Professionalism rating (optional)
  helpfulCount: Number,       // Number of helpful votes
  isAnonymous: Boolean,       // Anonymous rating flag
  responseTime: Number,       // Response time in minutes
  createdAt: Date,
  updatedAt: Date
}
```

### Enhanced User Model
```javascript
{
  rating: {
    average: Number,          // Average rating
    totalRatings: Number,     // Total number of ratings
    ratingBreakdown: {        // Breakdown by star level
      1: Number, 2: Number, 3: Number, 4: Number, 5: Number
    },
    lastRatedAt: Date
  }
}
```

### Enhanced Request Model
```javascript
{
  rating: {
    stars: Number,            // Star rating
    review: String,           // Review text
    ratedBy: ObjectId,        // User who rated
    ratedAt: Date             // Rating timestamp
  }
}
```

## API Endpoints

### Rating Management
- `POST /api/ratings` - Submit a new rating
- `GET /api/ratings/user/:userId` - Get all ratings for a user
- `GET /api/ratings/user/:userId/stats` - Get rating statistics for a user
- `GET /api/ratings/request/:requestId` - Get rating for a specific request
- `PUT /api/ratings/:ratingId` - Update a rating
- `DELETE /api/ratings/:ratingId` - Delete a rating
- `POST /api/ratings/:ratingId/helpful` - Mark rating as helpful

### Legacy Support
- `PATCH /api/requests/:id/rate` - Legacy rating endpoint (maintained for backward compatibility)

## Frontend Components

### 1. RatingModal (`RatingModal.jsx`)
Comprehensive rating submission modal with:
- Star rating selection
- Detailed criteria ratings
- Review text input
- Anonymous rating option
- Form validation

### 2. RatingDisplay (`RatingDisplay.jsx`)
Flexible rating display component with:
- Star visualization
- Review text display
- Metadata (date, rater, response time)
- Helpful vote functionality
- Compact and full display modes

### 3. RatingStats (`RatingStats.jsx`)
Rating analytics component showing:
- Average rating with stars
- Total rating count
- Rating breakdown with progress bars
- Quality indicators

### 4. UserRatingsPage (`UserRatingsPage.jsx`)
Complete ratings page with:
- Rating statistics
- Filtering and sorting options
- Pagination
- Rating list with helpful votes

## Usage Examples

### Submitting a Rating
```javascript
// Using the new rating system
const ratingData = {
  requestId: 'request123',
  stars: 5,
  review: 'Excellent service, very professional!',
  category: 'Home Repair',
  qualityOfWork: 5,
  communication: 4,
  professionalism: 5,
  isAnonymous: false
};

const response = await fetch('/api/ratings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(ratingData)
});
```

### Displaying Rating Statistics
```javascript
// Get user rating stats
const stats = await fetch(`/api/ratings/user/${userId}/stats`);
const { averageRating, totalRatings, ratingBreakdown } = await stats.json();

// Display in component
<RatingStats stats={{ average: averageRating, totalRatings, ratingBreakdown }} />
```

### Viewing User Ratings
```javascript
// Navigate to user ratings page
navigate(`/ratings/${userId}`);

// Or fetch ratings programmatically
const ratings = await fetch(`/api/ratings/user/${userId}?page=1&limit=10`);
const { ratings: ratingList, pagination } = await ratings.json();
```

## Security & Validation

### Rating Validation
- Only request owners can rate helpers
- Users cannot rate themselves
- Only completed requests can be rated
- One rating per request per user
- Rating values must be between 1-5

### Authorization
- Users can only edit/delete their own ratings
- Users cannot mark their own ratings as helpful
- Anonymous ratings hide rater identity

### Data Integrity
- Automatic calculation of user average ratings
- Rating breakdown updates in real-time
- Response time calculation from request timestamps

## Integration Points

### Dashboard Integration
- Rating modal appears after marking requests as completed
- Rating display in completed tasks section
- Rating statistics in user profiles

### User Profile Integration
- Average rating display in profile cards
- "View All Ratings" button for users with ratings
- Rating breakdown in profile details

### Real-time Updates
- Socket.io notifications for new ratings
- Automatic UI updates after rating submission
- Real-time helpful vote updates

## Migration Notes

### Backward Compatibility
- Legacy rating endpoints maintained
- Existing ratings automatically migrated
- Old rating display components still functional

### Database Migration
- New rating schema is additive
- Existing user rating fields preserved
- Automatic calculation of new rating statistics

## Future Enhancements

### Planned Features
- Rating response system (helpers can respond to ratings)
- Rating moderation and reporting
- Rating-based badges and achievements
- Advanced rating analytics and insights
- Rating export functionality

### Performance Optimizations
- Rating caching for frequently accessed data
- Pagination for large rating lists
- Optimized database queries with proper indexing
- CDN integration for rating images and assets

## Troubleshooting

### Common Issues
1. **Rating not appearing**: Check if request is completed and user is authorized
2. **Average not updating**: Verify rating calculation logic and database updates
3. **Modal not opening**: Ensure proper state management and event handling
4. **API errors**: Check authentication tokens and request validation

### Debug Information
- Rating submission logs in server console
- Client-side error handling with user feedback
- Database query optimization monitoring
- Performance metrics for rating operations

## Contributing

When adding new rating features:
1. Update database schemas with proper validation
2. Add comprehensive API endpoints with error handling
3. Create reusable frontend components
4. Include proper documentation and examples
5. Add unit tests for rating logic
6. Update this documentation

---

This rating system provides a robust foundation for community feedback and trust-building within the Neighbor Aid Connect platform. 