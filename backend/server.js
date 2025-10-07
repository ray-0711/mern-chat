const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(express.json());

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://mern-chat-app.netlify.app"
];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Schema
const messageSchema = new mongoose.Schema({
  user: String,
  text: String,
  room: String,
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// HTTP + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET","POST"], credentials: true },
  transports: ['websocket','polling']
});

io.on('connection', socket => {
  console.log('🔗 User connected:', socket.id);

  socket.on('joinRoom', async ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    const messages = await Message.find({ room }).sort({ createdAt: 1 });
    socket.emit('previousMessages', messages);
  });

  socket.on('sendMessage', async ({ text, room }) => {
    if (!socket.username) return;
    const msg = new Message({ user: socket.username, text, room });
    const saved = await msg.save();
    io.to(room).emit('newMessage', saved);
  });

  socket.on('deleteMessage', async ({ messageId, room }) => {
    const msg = await Message.findById(messageId);
    if (msg && msg.user === socket.username) {
      await Message.findByIdAndDelete(messageId);
      io.to(room).emit('messageDeleted', messageId);
    }
  });

  socket.on('disconnect', () => console.log('🔌 User disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
