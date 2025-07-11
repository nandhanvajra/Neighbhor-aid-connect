const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const config = require('./config/config');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const requestRoutes = require('./routes/requestRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: config.socket.cors
});

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(cookieParser());

// Attach io to req so we can emit from routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/requests', requestRoutes);


// MongoDB connection
mongoose.connect(config.mongodb.uri, config.mongodb.options)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Socket.io events
io.on('connection', socket => {
  console.log('Client connected:', socket.id);

  socket.on('joinRoom', roomId => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
});

// Start the server
server.listen(config.port, () => console.log(`Server running on port ${config.port}`));
