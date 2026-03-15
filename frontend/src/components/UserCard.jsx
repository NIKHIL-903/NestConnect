// Displays user information card
import React from 'react';
import { useNavigate } from 'react-router-dom';
import profilePlaceholder from '../assets/profile.png';

const UserCard = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="card text-center flex-col items-center gap-1 user-card">
      <img
        src={user.profileImage || profilePlaceholder}
        alt={user.name}
        className="user-card-avatar"
        style={{
          width: '64px', height: '64px', borderRadius: '50%',
          objectFit: 'cover', margin: '0 auto 0.5rem', display: 'block'
        }}
      />
      <h3 style={{ margin: 0 }}>{user.name}</h3>
      <p className="text-muted text-sm">{user.occupation}</p>
      
      {user.sharedDomains && user.sharedDomains.length > 0 && (
        <div className="flex gap-1 justify-center mt-1 text-sm" style={{ flexWrap: 'wrap' }}>
          {user.sharedDomains.map(domain => (
            <span key={domain} style={{ 
              background: '#333', 
              padding: '2px 8px', 
              borderRadius: '12px' 
            }}>
              {domain}
            </span>
          ))}
        </div>
      )}
      
      <button 
        className="btn secondary mt-2" 
        onClick={() => navigate(`/profile/${user.userId}`)}
      >
        View Profile
      </button>
    </div>
  );
};

export default UserCard;
