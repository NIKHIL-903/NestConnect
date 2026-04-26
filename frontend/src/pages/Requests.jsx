import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPendingRequests, getConnections, acceptRequest, rejectRequest } from '../api/api';
import profilePlaceholder from '../assets/profile.png';

const Requests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('accepted');
  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const incomingRequests = requests.filter((req) => req.receiverId?._id === user?._id);
  const sentRequests = requests.filter((req) => req.senderId?._id === user?._id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        const [pendingRes, connRes] = await Promise.all([getPendingRequests(), getConnections()]);
        setRequests(pendingRes.data.data);
        setConnections(connRes.data.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load connections');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAccept = async (userId) => {
    try {
      await acceptRequest(userId);
      const req = requests.find(r => r.senderId.userId === userId);
      setRequests(requests.filter(r => r.senderId.userId !== userId));
      if (req) {
         setConnections([...connections, req]);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleReject = async (userId) => {
    try {
      await rejectRequest(userId);
      setRequests(requests.filter(r => r.senderId.userId !== userId));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const openProfile = (profileUserId) => {
    navigate(`/profile/${profileUserId}?source=requests`);
  };

  return (
    <div className="dashboard-wrapper">
      <div className="header mb-4">
        <h1>Connections</h1>
        <p>Keep track of the people you are getting to know.</p>
      </div>

      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          My connections ({connections.length})
        </div>
        <div 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Requests ({requests.length})
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="text-center p-4">Loading connections...</div>
        ) : error ? (
          <div className="card text-center text-muted p-4">{error}</div>
        ) : activeTab === 'pending' ? (
          <div className="flex-col gap-2">
            {incomingRequests.length === 0 && sentRequests.length === 0 ? (
              <div className="card text-center text-muted p-4">No requests right now.</div>
            ) : (
              <>
                <div className="mb-2">
                  <h3 className="mb-1">Incoming</h3>
                  <p className="text-sm text-muted">People who would like to connect with you.</p>
                </div>
                {incomingRequests.length === 0 ? (
                  <div className="card text-center text-muted p-4">No incoming requests.</div>
                ) : (
                  incomingRequests.map(req => (
                    <div key={req._id} className="card request-row">
                      <div
                        className="flex gap-2 items-center profile-preview-trigger"
                        onClick={() => openProfile(req.senderId.userId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openProfile(req.senderId.userId);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <img
                          src={req.senderId.profileImage || profilePlaceholder}
                          alt={req.senderId.name}
                          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ textAlign: 'left' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{req.senderId.name}</h3>
                          <p className="text-sm text-muted" style={{ margin: 0 }}>{req.senderId.userId}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 request-actions">
                        <button 
                          className="btn" 
                          onClick={() => handleAccept(req.senderId.userId)}
                          style={{ padding: '0.5rem 1rem', width: 'auto' }}
                        >
                          Accept
                        </button>
                        <button 
                          className="btn secondary" 
                          onClick={() => handleReject(req.senderId.userId)}
                          style={{ padding: '0.5rem 1rem', width: 'auto' }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <div className="mb-2 mt-4">
                  <h3 className="mb-1">Sent</h3>
                  <p className="text-sm text-muted">People you have reached out to.</p>
                </div>
                {sentRequests.length === 0 ? (
                  <div className="card text-center text-muted p-4">No sent requests.</div>
                ) : (
                  sentRequests.map(req => (
                    <div key={req._id} className="card request-row">
                      <div
                        className="flex gap-2 items-center profile-preview-trigger"
                        onClick={() => openProfile(req.receiverId.userId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openProfile(req.receiverId.userId);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <img
                          src={req.receiverId.profileImage || profilePlaceholder}
                          alt={req.receiverId.name}
                          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ textAlign: 'left' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{req.receiverId.name}</h3>
                          <p className="text-sm text-muted" style={{ margin: 0 }}>{req.receiverId.userId}</p>
                        </div>
                      </div>
                      <div className="request-pill">Pending</div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid">
            {connections.length === 0 ? (
              <div className="card text-center text-muted p-4" style={{ gridColumn: '1 / -1' }}>
                No connections yet.
              </div>
            ) : (
              connections.map(conn => {
                const otherPerson = conn.senderId._id === user._id ? conn.receiverId : conn.senderId;
                return (
                <div key={conn._id} className="card text-center flex-col items-center gap-1">
                  <div
                    className="profile-preview-trigger"
                    onClick={() => openProfile(otherPerson.userId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openProfile(otherPerson.userId);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <img
                      src={otherPerson.profileImage || profilePlaceholder}
                      alt={otherPerson.name}
                      style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.5rem', display: 'block' }}
                    />
                    <h3 style={{ margin: 0 }}>{otherPerson.name}</h3>
                    <p className="text-sm text-muted mb-2" style={{ margin: 0 }}>{otherPerson.userId}</p>
                  </div>
                  <button 
                    className="btn secondary" 
                    style={{ width: '100%' }}
                    onClick={() => {
                      navigate(`/message/${conn._id}`);
                    }}
                  >
                    Message
                  </button>
                </div>
              )})
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
