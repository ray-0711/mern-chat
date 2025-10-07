const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const messageSchema = new mongoose.Schema({
  user: String,
  text: String,
  room: String,
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

mongoose.connect('mongodb://localhost:27017/mernchat');

const server = app.listen(5000, () => console.log('Server running on port 5000'));

const io = socketIo(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
  socket.on('joinRoom', async ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    const messages = await Message.find({ room });
    socket.emit('previousMessages', messages);
  });

  socket.on('sendMessage', async (data) => {
    const message = new Message({ user: socket.username, text: data.text, room: data.room });
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