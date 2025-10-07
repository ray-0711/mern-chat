const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const cors = require('cors');
const http = require('http');

const app = express();

// FIXED: Enhanced CORS configuration
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://mern-chat-app.netlify.app",  // Remove trailing slash
    "https://mern-chat-app.netlify.app"   // Add without slash too
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// FIXED: Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date()
  });
});

const server = http.createServer(app);

// FIXED: MongoDB connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mernchat';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Message schema
const messageSchema = new mongoose.Schema({
  user: String,
  text: String,
  room: String,
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// FIXED: Enhanced Socket.io configuration
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "https://mern-chat-app.netlify.app",
      "https://mern-chat-app.netlify.app"  // Both with and without trailing slash
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']  // FIXED: Add transports
});

// FIXED: Add connection logging
io.on('connection', (socket) => {
  console.log('🔗 User connected:', socket.id);

  socket.on('joinRoom', async ({ username, room }) => {
    try {
      console.log(`🚪 ${username} joining room: ${room}`);
      socket.join(room);
      socket.username = username;
      
      const messages = await Message.find({ room }).sort({ createdAt: 1 });
      console.log(`📨 Sending ${messages.length} messages to ${username}`);
      socket.emit('previousMessages', messages);
    } catch (error) {
      console.error('❌ Error joining room:', error);
    }
  });

  socket.on('sendMessage', async (data) => {
    try {
      console.log('📝 New message:', { user: socket.username, text: data.text, room: data.room });
      
      const message = new Message({
        user: socket.username,
        text: data.text,
        room: data.room
      });
      
      const savedMessage = await message.save();
      console.log('💾 Message saved:', savedMessage._id);
      
      io.to(data.room).emit('newMessage', savedMessage);
      console.log('📢 Message broadcasted to room:', data.room);
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  });

  socket.on('deleteMessage', async (data) => {
    try {
      const message = await Message.findById(data.messageId);
      if (message && message.user === socket.username) {
        await Message.findByIdAndDelete(data.messageId);
        io.to(data.room).emit('messageDeleted', data.messageId);
        console.log('✅ Message deleted:', data.messageId);
      }
    } catch (error) {
      console.error('❌ Error deleting message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});