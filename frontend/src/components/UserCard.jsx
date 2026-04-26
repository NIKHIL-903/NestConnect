// Displays user information card
import React from 'react';
import { useNavigate } from 'react-router-dom';
import profilePlaceholder from '../assets/profile.png';

const UserCard = ({ user }) => {
  const navigate = useNavigate();
  const openProfile = () => navigate(`/profile/${user.userId}`);
  const relevanceReasons = user.relevanceReasons || [];
  const sharedSkills = user.sharedSkills || [];

  return (
    <div className="card text-center flex-col items-center gap-1 user-card">
      <div
        className="profile-preview-trigger"
        onClick={openProfile}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openProfile();
          }
        }}
        role="button"
        tabIndex={0}
      >
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
      </div>

      {relevanceReasons.length > 0 && (
        <p className="text-sm" style={{ color: 'var(--primary-accent)', margin: '0.25rem 0 0' }}>
          {relevanceReasons[0]}
        </p>
      )}
      
      {sharedSkills.length > 0 && (
        <div className="flex gap-1 justify-center mt-1 text-sm" style={{ flexWrap: 'wrap' }}>
          {sharedSkills.slice(0, 3).map(skill => (
            <span key={skill} style={{ 
              background: 'var(--bg-color)', 
              border: '1px solid var(--border-color)',
              padding: '2px 8px', 
              borderRadius: '12px' 
            }}>
              {skill}
            </span>
          ))}
        </div>
      )}

      {relevanceReasons.length > 1 && (
        <p className="text-muted text-sm" style={{ margin: 0 }}>
          {relevanceReasons.slice(1).join(' · ')}
        </p>
      )}
      
      <button 
        className="btn secondary mt-2" 
        onClick={openProfile}
      >
        View profile
      </button>
    </div>
  );
};

export default UserCard;
