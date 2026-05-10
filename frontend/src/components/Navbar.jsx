// Navigation bar
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/discover"><h3>NestConnect</h3></Link>
        {user?.org?.orgName && (
          <h3 className="navbar-org-name">{user.org.orgName}</h3>
        )}
      </div>
      <div className="nav-links">
        <Link to="/discover" className={isActive('/discover')}><h3>Discover</h3></Link>
        <Link to="/profile/me" className={isActive('/profile/me')}><h3>My Profile</h3></Link>
        <Link to="/connections" className={isActive('/connections')}><h3>Connections and Requests</h3></Link>
      </div>
      <div className="nav-actions">
        {user?.userId && (
          <span className="navbar-user-id">@{user.userId}</span>
        )}
        <button 
          onClick={async () => {
            await logout();
            navigate('/auth');
          }}
          className="navbar-logout"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
