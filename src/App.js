import ChatRoom from './component/ChatRoom';
import Home from './component/Home';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/home" element={<Home/>}/>
          <Route path="/" element={<ChatRoom/>}/>
        </Routes>
    </Router>
  );
}

export default App;

