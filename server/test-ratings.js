const mongoose = require('mongoose');
const User = require('./models/userSchema');
const Request = require('./models/requestSchema');
const Rating = require('./models/ratingSchema');
const config = require('./config/config');

// Connect to MongoDB
mongoose.connect(config.mongodb.uri, config.mongodb.options)
  .then(() => console.log('MongoDB connected for testing'))
  .catch(err => console.error('MongoDB error:', err));

async function createTestRatings() {
  try {
    console.log('Creating test ratings...');

    // Get all users
    const users = await User.find().limit(5);
    console.log(`Found ${users.length} users`);
    
    if (users.length < 2) {
      console.log('Need at least 2 users to create test ratings');
      console.log('Please create some users first through the application');
      return;
    }

    console.log('Using users:', users.map(u => ({ id: u._id, name: u.name, job: u.job })));

    // Check if there are already ratings
    const existingRatings = await Rating.countDocuments();
    if (existingRatings > 0) {
      console.log(`Found ${existingRatings} existing ratings. Skipping test creation.`);
      return;
    }

    // Create some test requests
    const testRequests = [];
    for (let i = 0; i < 3; i++) {
      const request = new Request({
        userId: users[0]._id,
        category: 'plumbing',
        description: `Test request ${i + 1}`,
        urgency: 'medium',
        preferredTime: '2024-01-15 10:00',
        status: 'completed',
        completedBy: users[1]._id
      });
      await request.save();
      testRequests.push(request);
    }

    // Create test ratings
    const ratingData = [
      { stars: 5, review: 'Excellent service! Very professional and helpful.', qualityOfWork: 5, communication: 4, professionalism: 5 },
      { stars: 4, review: 'Good work, completed the task efficiently.', qualityOfWork: 4, communication: 4, professionalism: 4 },
      { stars: 5, review: 'Amazing helper! Would definitely recommend.', qualityOfWork: 5, communication: 5, professionalism: 5 }
    ];

    for (let i = 0; i < testRequests.length; i++) {
      const rating = new Rating({
        requestId: testRequests[i]._id,
        raterId: users[0]._id,
        ratedUserId: users[1]._id,
        stars: ratingData[i].stars,
        review: ratingData[i].review,
        category: 'plumbing',
        qualityOfWork: ratingData[i].qualityOfWork,
        communication: ratingData[i].communication,
        professionalism: ratingData[i].professionalism,
        isAnonymous: false
      });
      await rating.save();

      // Update request with rating
      testRequests[i].rating = {
        stars: ratingData[i].stars,
        review: ratingData[i].review,
        ratedBy: users[0]._id,
        ratedAt: new Date()
      };
      await testRequests[i].save();
    }

    // Update user rating statistics
    const helper = await User.findById(users[1]._id);
    if (helper) {
      await helper.updateRatingStats(5); // This will be recalculated properly
      console.log('Updated helper rating stats');
    }

    console.log('Test ratings created successfully!');
    console.log(`Created ${testRequests.length} test requests with ratings`);
    console.log(`Helper ${users[1].name} now has ratings`);

  } catch (error) {
    console.error('Error creating test ratings:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the test
createTestRatings(); 