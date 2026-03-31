const mongoose = require('mongoose');
const User = require('./models/userSchema');
const Request = require('./models/requestSchema');
const Rating = require('./models/ratingSchema');
const Activity = require('./models/activitySchema');
const CommunityEvent = require('./models/communityEventSchema');

// Hardcoded MongoDB URI
const MONGODB_URI = 'mongodb+srv://manognaram5:kaushik@cluster0.yrpizm0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    console.log('Clearing existing data from all collections...');
    await User.deleteMany({});
    await Request.deleteMany({});
    await Rating.deleteMany({});
    await Activity.deleteMany({});
    await CommunityEvent.deleteMany({});

    console.log('Creating users...');
    
    // Residents
    const resident1 = new User({ name: 'Alice Smith', email: 'alice@example.com', password: 'password123', address: '101 Apple St', job: 'Teacher', userType: 'resident', role: 'resident' });
    const resident2 = new User({ name: 'Bob Jones', email: 'bob@example.com', password: 'password123', address: '102 Banana St', job: 'Engineer', userType: 'resident', role: 'resident' });
    const resident3 = new User({ name: 'Charlie Davis', email: 'charlie@example.com', password: 'password123', address: '103 Cherry St', job: 'Artist', userType: 'resident', role: 'resident' });
    await resident1.save();
    await resident2.save();
    await resident3.save();

    // Workers
    const worker1 = new User({ name: 'Dave Plumber', email: 'dave@example.com', password: 'password123', address: '201 Date St', job: 'plumber', userType: 'worker', role: 'plumber', skills: ['plumbing'] });
    const worker2 = new User({ name: 'Eve Electric', email: 'eve@example.com', password: 'password123', address: '202 Elderberry St', job: 'electrician', userType: 'worker', role: 'electrician', skills: ['electrical'] });
    const worker3 = new User({ name: 'Frank Cleaner', email: 'frank@example.com', password: 'password123', address: '203 Fig St', job: 'cleaner', userType: 'worker', role: 'cleaner', skills: ['cleaning'] });
    const worker4 = new User({ name: 'Grace Maid', email: 'grace@example.com', password: 'password123', address: '204 Grape St', job: 'maid', userType: 'worker', role: 'maid', skills: ['cleaning', 'maid'] });
    await worker1.save();
    await worker2.save();
    await worker3.save();
    await worker4.save();

    // Admin
    const admin = new User({ name: 'Admin User', email: 'admin@example.com', password: 'password123', address: '1 Admin Way', job: 'System Administrator', userType: 'worker', role: 'admin', isAdmin: true });
    await admin.save();

    console.log('Creating requests & ratings...');
    
    // Request 1: Pending Plumbing Request from Alice
    const req1 = new Request({
        userId: resident1._id,
        category: 'plumbing',
        description: 'My kitchen sink is leaking heavily.',
        urgency: 'high',
        preferredTime: 'Morning',
        status: 'pending'
    });
    await req1.save();

    // Request 2: In-Progress Electrical Request from Bob, taken by Eve
    const req2 = new Request({
        userId: resident2._id,
        category: 'electrical',
        description: 'Need to install a new ceiling fan.',
        urgency: 'medium',
        preferredTime: 'Anytime',
        status: 'in-progress',
        completedBy: worker2._id
    });
    await req2.save();

    // Request 3: Completed Cleaning Request from Charlie, done by Frank
    const req3 = new Request({
        userId: resident3._id,
        category: 'cleaning',
        description: 'Deep cleaning required before guests arrive.',
        urgency: 'low',
        preferredTime: 'Weekend',
        status: 'completed',
        completedBy: worker3._id,
        rating: {
            stars: 5,
            review: 'Frank was extremely thorough and polite!',
            ratedBy: resident3._id,
            ratedAt: new Date()
        }
    });
    await req3.save();

    // Create a Rating document for Request 3
    const rating3 = new Rating({
        requestId: req3._id,
        raterId: resident3._id,
        ratedUserId: worker3._id,
        stars: 5,
        review: 'Frank was extremely thorough and polite!',
        category: 'cleaning',
        qualityOfWork: 5,
        communication: 5,
        professionalism: 5
    });
    await rating3.save();

    // Update Frank's stats
    await worker3.updateRatingStats(5);

    // Request 4: Completed Maid Request from Alice, done by Grace
    const req4 = new Request({
        userId: resident1._id,
        category: 'maid',
        description: 'Weekly house chores.',
        urgency: 'medium',
        preferredTime: 'Afternoon',
        status: 'completed',
        completedBy: worker4._id,
        rating: {
            stars: 4,
            review: 'Good work, but arrived a bit late.',
            ratedBy: resident1._id,
            ratedAt: new Date()
        }
    });
    await req4.save();

    // Create a Rating document for Request 4
    const rating4 = new Rating({
        requestId: req4._id,
        raterId: resident1._id,
        ratedUserId: worker4._id,
        stars: 4,
        review: 'Good work, but arrived a bit late.',
        category: 'maid',
        qualityOfWork: 4,
        communication: 3,
        professionalism: 4
    });
    await rating4.save();

    // Update Grace's stats
    await worker4.updateRatingStats(4);

    console.log('Creating community events...');
    const event1 = new CommunityEvent({
        title: 'Neighborhood Spring Cleanup',
        description: 'Join us to clean the local park!',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // Next week + 4 hours
        createdBy: admin._id,
        attendees: [
            { userId: resident1._id },
            { userId: resident2._id },
            { userId: worker1._id }
        ]
    });
    await event1.save();

    console.log('Creating activity logs...');
    // Activity Log 1
    await Activity.logActivity({
        userId: resident3._id,
        userName: resident3.name,
        userEmail: resident3.email,
        action: 'rate_service',
        details: { requestId: req3._id, ratedUserId: worker3._id, stars: 5 }
    });
    // Activity Log 2
    await Activity.logActivity({
        userId: resident1._id,
        userName: resident1.name,
        userEmail: resident1.email,
        action: 'create_request',
        details: { requestId: req1._id, category: 'plumbing' }
    });

    console.log('Database seeded successfully completely!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
