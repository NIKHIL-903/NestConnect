import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile, sendConnectionRequest, getMe, getOrganization } from '../api/api';
import profilePlaceholder from '../assets/profile.png';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let res;
        if (id === 'me') {
          res = await getMe();
        } else {
          res = await getUserProfile(id);
        }
        
        const userData = res.data.data;
        
        // Fetch org details if user has an orgCode
        if (userData.orgCode) {
            try {
                const orgRes = await getOrganization(userData.orgCode);
                userData.org = orgRes.data.data;
            } catch (orgErr) {
                console.error("Failed to fetch organization details:", orgErr);
                userData.org = null;
            }
        }
        
        setUser(userData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleConnect = async () => {
    try {
      await sendConnectionRequest(id);
      setRequestSent(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  if (loading) return <div className="text-center p-4">Loading profile...</div>;
  if (!user) return <div className="text-center p-4">User not found.</div>;

  return (
    <div className="page-wrapper" style={{ maxWidth: '800px' }}>
      <div className="card">
        <div className="flex gap-4 items-center mb-4 pb-4" style={{ borderBottom: '1px solid #333' }}>
          <img
            src={user.profileImage || profilePlaceholder}
            alt={user.name}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1 }}>
            <div className="flex justify-between items-start">
              <div>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem', marginTop: 0 }}>{user.name}</h2>
                <p className="text-muted" style={{ fontSize: '1.1rem', margin: 0 }}>{user.occupation}</p>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ 
                    background: 'rgba(255, 122, 0, 0.1)', 
                    color: 'var(--primary-accent)', 
                    padding: '4px 12px', 
                    borderRadius: '16px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}>
                    {user.orgCode}
                  </span>
                  <span style={{ 
                    background: '#333', 
                    color: '#fff', 
                    padding: '4px 12px', 
                    borderRadius: '16px',
                    fontSize: '0.85rem'
                  }}>
                    {user.org?.orgName || 'N/A'}
                  </span>
                </div>
                <span style={{ 
                    background: '#333', 
                    color: '#fff', 
                    padding: '4px 12px', 
                    borderRadius: '16px',
                    fontSize: '0.85rem'
                  }}>
                    {user.org?.city || 'N/A'}
                  </span>
                {user.org?.description && (
                  <p className="text-sm text-muted mt-1" style={{ margin: 0 }}>{user.org.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="mb-1">About</h3>
          <p style={{ lineHeight: '1.6' }}>{user.bio || 'No bio provided.'}</p>
        </div>

        {user.achievements && (
          <div className="mb-4">
            <h3 className="mb-1">Achievements</h3>
            <p style={{ lineHeight: '1.6' }}>{user.achievements}</p>
          </div>
        )}

        <div className="mb-4 p-4" style={{ background: 'var(--bg-color)', borderRadius: '8px' }}>
          <h3 className="mb-2" style={{ fontSize: '1.1rem' }}>Residence Details</h3>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <p className="text-sm text-muted mb-1" style={{ margin: 0 }}>Block / Tower / Road No</p>
              <p style={{ margin: 0, fontWeight: '500' }}>{user.block || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted mb-1" style={{ margin: 0 }}>Floor</p>
              <p style={{ margin: 0, fontWeight: '500' }}>{user.floor || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted mb-1" style={{ margin: 0 }}>Door no / House no</p>
              <p style={{ margin: 0, fontWeight: '500' }}>{user.doorNo || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="grid mb-4">
          <div>
            <h3 className="mb-2">Interests</h3>
            {user.domains?.map((domain, index) => (
              <div key={index} className="mb-2">
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--primary-accent)' }}>{domain.name}</p>
                <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                  {domain.skills?.map(skill => (
                    <span key={skill} style={{ background: '#333', padding: '4px 10px', borderRadius: '4px', fontSize: '0.9rem' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {user.mentorDomains && user.mentorDomains.length > 0 && (
            <div>
              <h3 className="mb-2">Would Like to Mentor In</h3>
              {user.mentorDomains.map((domain, index) => (
                <div key={`mentor-${index}`} className="mb-2">
                  <p className="font-bold text-sm mb-1" style={{ color: 'var(--primary-accent)' }}>{domain.name}</p>
                  <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                    {domain.skills?.map(skill => (
                      <span key={`mentor-skill-${skill}`} style={{ 
                        background: 'rgba(255, 122, 0, 0.1)', 
                        color: 'var(--primary-accent)',
                        border: '1px solid var(--primary-accent)',
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.9rem' 
                      }}>
                        ★ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {id === 'me' ? (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #333', textAlign: 'center' }}>
            <button 
              className="btn" 
              onClick={() => navigate('/update-profile')}
              style={{ maxWidth: '200px' }}
            >
              Update Profile
            </button>
          </div>
        ) : (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #333', textAlign: 'center' }}>
            <button
              className="btn"
              onClick={handleConnect}
              disabled={requestSent}
              style={{ maxWidth: '200px' }}
            >
              {requestSent ? 'Request Sent' : 'Connect'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
