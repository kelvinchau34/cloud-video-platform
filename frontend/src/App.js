import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import About from './components/About';
import Transcode from './components/Transcode';
import History from './components/History';

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login user={user} setUser={setUser} />} />
        <Route path="/about" element={<About />} />
        <Route
          path="/video-transcode"
          element={user ? <Transcode user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/history"
          element={user ? <Transcode user={user} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;