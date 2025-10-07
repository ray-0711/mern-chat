const messageSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true,
    default: 'general'
  },
  reactions: {
    type: Map,
    of: [String], // Array of emojis for each user
    default: {}
  },
  edited: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});