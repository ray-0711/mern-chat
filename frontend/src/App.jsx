import { useState } from 'react';
import JoinScreen from './components/JoinScreen';
import Chat from './components/Chat';

function App() {
  const [user, setUser] = useState(null);
  return !user ? <JoinScreen onJoin={setUser} /> : <Chat username={user} room="general" />;
}

export default App;