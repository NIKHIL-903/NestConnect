// Navigation bar
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">NestConnect</Link>
      </div>
      <div className="nav-links">
        <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
        <Link to="/profile/me" className={isActive('/profile/me')}>Profile</Link>
        <Link to="/requests" className={isActive('/requests')}>Requests</Link>
      </div>
      <div className="nav-actions">
        <button 
          onClick={async () => {
            await logout();
            navigate('/auth');
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-color)',
            fontSize: '1rem',
            opacity: 0.8,
            transition: 'opacity 0.2s, color 0.2s',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '1';
            e.target.style.color = 'var(--primary-accent)';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '0.8';
            e.target.style.color = 'var(--text-color)';
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
