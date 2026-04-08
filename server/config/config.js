require("dotenv").config();
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
const config = {
  port: process.env.PORT || 3000,
  mongodb: {
    uri:
      process.env.MONGODB_URI ||
      "mongodb+srv://manognaram5:kaushik@cluster0.yrpizm0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  serviceCategories: [
    "plumbing",
    "electrical",
    "maid",
    "cook",
    "cleaning",
    "gardening",
    "security",
    "maintenance",
    "other",
  ],
  urgencyLevels: ["low", "medium", "high"],
  requestStatuses: ["pending", "in-progress", "completed", "cancelled"],
  availableRoles: [
    "admin",
    "resident",
    "worker",
    "volunteer",
    "staff",
    "manager",
    "technician",
    "cook",
    "maid",
    "security",
    "gardener",
    "plumber",
    "electrician",
    "cleaner",
    "maintenance",
  ],
  profile: {
    genderOptions: [
      {
        value: "male",
        label: "Male",
      },
      {
        value: "female",
        label: "Female",
      },
      {
        value: "other",
        label: "Other",
      },
      {
        value: "prefer-not-to-say",
        label: "Prefer not to say",
      },
    ],
    skillCategories: [
      "plumbing",
      "electrical",
      "cooking",
      "cleaning",
      "gardening",
      "security",
      "maintenance",
      "childcare",
      "eldercare",
      "petcare",
      "driving",
      "technology",
      "language",
      "tutoring",
      "art",
      "music",
      "fitness",
      "healthcare",
      "legal",
      "financial",
    ],
    maxBioLength: 500,
    maxSkillsCount: 10,
    requiredFields: ["name", "email", "password", "address"],
    optionalFields: [
      "phone",
      "bio",
      "skills",
      "profilePicture",
      "dateOfBirth",
      "gender",
      "occupation",
      "emergencyContact",
      "preferences",
    ],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
  upload: {
    maxFileSize: 5 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/gif"],
  },
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
  socket: {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  },
};
module.exports = config;
