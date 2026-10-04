import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Calendar, Users, Trophy } from 'lucide-react';
import CustomerView from './components/CustomerView';
import AdminDashboard from './components/AdminDashboard';
import './index.css';

function Nav() {
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin');

  if (isAdmin) return null;

  return (
    <nav className="top-nav">
      <div className="nav-brand">
        <Trophy className="text-gradient" size={28} />
        <span>Sport<span className="text-gradient">AI</span></span>
      </div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link to="/" className="btn btn-outline">Trang Chủ</Link>
        <Link to="/admin" className="btn btn-primary">Dành cho Admin</Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Nav />
        <Routes>
          <Route path="/" element={<CustomerView />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
