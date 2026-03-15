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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pendingRes, connRes] = await Promise.all([getPendingRequests(), getConnections()]);
        setRequests(pendingRes.data.data);
        setConnections(connRes.data.data);
      } catch (err) {
        console.error(err);
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
    }
  };

  const handleReject = async (userId) => {
    try {
      await rejectRequest(userId);
      setRequests(requests.filter(r => r.senderId.userId !== userId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="header mb-4">
        <h1>Connections</h1>
        <p>Manage your community network</p>
      </div>

      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          My Connections ({connections.length})
        </div>
        <div 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Requests ({requests.length})
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : activeTab === 'pending' ? (
          <div className="flex-col gap-2">
            {requests.length === 0 ? (
              <div className="card text-center text-muted p-4">No pending requests</div>
            ) : (
              requests.map(req => (
                <div key={req._id} className="card flex justify-between items-center" style={{ flexDirection: 'row', display: 'flex' }}>
                  <div className="flex gap-2 items-center">
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
                  <div className="flex gap-1">
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
          </div>
        ) : (
          <div className="grid">
            {connections.length === 0 ? (
              <div className="card text-center text-muted p-4" style={{ gridColumn: '1 / -1' }}>
                No accepted connections yet
              </div>
            ) : (
              connections.map(conn => {
                const otherPerson = conn.senderId._id === user._id ? conn.receiverId : conn.senderId;
                return (
                <div key={conn._id} className="card text-center flex-col items-center gap-1">
                  <img
                    src={otherPerson.profileImage || profilePlaceholder}
                    alt={otherPerson.name}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.5rem', display: 'block' }}
                  />
                  <h3 style={{ margin: 0 }}>{otherPerson.name}</h3>
                  <p className="text-sm text-muted mb-2" style={{ margin: 0 }}>{otherPerson.userId}</p>
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
