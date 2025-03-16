import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Homee';
import Registration from './components/Regist';
import Login from './components/Login';
import Admin from './components/AdminP';
import Forensic from './components/ForensicPF';
import Staff from './components/StaffPF';
import Police from './components/PolicePF';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;