// JoinScreen.jsx
import { useState } from 'react';

const JoinScreen = ({ onJoin }) => {
  const [username, setUsername] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-gray-800/80 p-8 rounded-2xl border border-gray-700 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">💬</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">MERN Chat</h1>
          <p className="text-gray-400">Connect with people worldwide</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); username.trim() && onJoin(username.trim()); }}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-4 mb-6 bg-gray-700/50 text-white rounded-xl border border-gray-600 focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl font-semibold hover:from-blue-500 hover:to-purple-500 transition-all"
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinScreen;
