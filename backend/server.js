const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const cors = require('cors');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mernchat';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Message schema
const messageSchema = new mongoose.Schema({
  user: String,
  text: String,
  room: String,
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Socket.io
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "https://mern-chat-app.netlify.app/"  // Your Netlify URL
    ],
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  socket.on('joinRoom', async ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    const messages = await Message.find({ room });
    socket.emit('previousMessages', messages);
  });

  socket.on('sendMessage', async (data) => {
    const message = new Message({
      user: socket.username,
      text: data.text,
      room: data.room
    });
    const savedMessage = await message.save();
    io.to(data.room).emit('newMessage', savedMessage);
  });

  socket.on('deleteMessage', async (data) => {
    const message = await Message.findById(data.messageId);
    if (message && message.user === socket.username) {
      await Message.findByIdAndDelete(data.messageId);
      io.to(data.room).emit('messageDeleted', data.messageId);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});