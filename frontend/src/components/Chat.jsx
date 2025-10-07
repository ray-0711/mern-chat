import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// This will be set during build
const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

const Chat = ({ username, room }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit('joinRoom', { username, room });
    socket.on('previousMessages', setMessages);
    socket.on('newMessage', (msg) => {
      setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
      scrollToBottom();
    });
    socket.on('messageDeleted', (id) => setMessages(prev => prev.filter(msg => msg._id !== id)));
    return () => { socket.off('previousMessages'); socket.off('newMessage'); socket.off('messageDeleted'); };
  }, [username, room]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit('sendMessage', { text: input.trim(), room });
    setInput('');
  };

  const deleteMessage = (id) => {
    if (window.confirm('Delete this message?')) socket.emit('deleteMessage', { messageId: id, room });
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 to-gray-800">
      <header className="bg-gray-800/80 p-4 text-white border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h1 className="text-xl font-bold">MERN Chat</h1>
            <span className="text-gray-400">Room: {room}</span>
          </div>
          <div className="text-blue-400 font-medium">{username}</div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.map((msg, index) => {
          const isOwn = msg.user === username;
          const showUserInfo = !messages[index - 1] || messages[index - 1].user !== msg.user;
          return <Message key={msg._id} message={msg} isOwn={isOwn} showUserInfo={showUserInfo} onDelete={deleteMessage} />;
        })}
        <div ref={messagesEndRef} />
      </main>

      <form onSubmit={sendMessage} className="bg-gray-800/80 p-4 border-t border-gray-700">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message in ${room}...`}
            className="flex-1 p-3 bg-gray-700/50 text-white rounded-xl border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="bg-blue-600 text-white px-6 rounded-xl font-semibold hover:bg-blue-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

const Message = ({ message, isOwn, showUserInfo, onDelete }) => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
         onMouseEnter={() => setShowOptions(true)}
         onMouseLeave={() => setShowOptions(false)}>
      <div className={`max-w-md ${isOwn ? 'ml-auto' : ''}`}>
        {!isOwn && showUserInfo && (
          <div className="flex items-center gap-2 mb-1 ml-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {message.user[0]?.toUpperCase()}
            </div>
            <span className="text-blue-400 font-semibold text-sm bg-blue-400/10 px-2 py-1 rounded-full">
              {message.user}
            </span>
          </div>
        )}
        <div className={`p-3 rounded-xl relative ${isOwn 
          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-md' 
          : 'bg-gray-700 text-white rounded-bl-md border border-gray-600'
        }`}>
          <div className="break-words">{message.text}</div>
          
          {showOptions && isOwn && (
            <div className="absolute -top-8 right-2 flex gap-1 bg-gray-800 border border-gray-600 rounded-lg p-1">
              <button 
                onClick={() => onDelete(message._id)}
                className="p-2 text-red-400 hover:bg-gray-700 rounded transition-colors"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
        {isOwn && showUserInfo && (
          <div className="text-right mt-1">
            <span className="text-gray-400 text-xs">You</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;