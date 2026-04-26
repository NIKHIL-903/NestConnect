import React, { useState, useEffect, useCallback } from 'react';
import UserCard from '../components/UserCard';
import DomainSelector from '../components/DomainSelector';
import { getDiscoverUsers, getPopularUsers } from '../api/api';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('peers'); // peers or learners
  const [selectedDomain, setSelectedDomain] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popularUsers, setPopularUsers] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!selectedDomain) return setUsers([]);
    setLoading(true);
    try {
      const type = activeTab === 'peers' ? 'peer' : 'mentor';
      const res = await getDiscoverUsers(selectedDomain, type, 1, 10);
      setUsers(res.data.data.users);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedDomain]);

  const fetchPopularUsers = useCallback(async () => {
    setPopularLoading(true);
    try {
      const res = await getPopularUsers();
      setPopularUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
      setPopularUsers([]);
    } finally {
      setPopularLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchPopularUsers();
  }, [fetchPopularUsers]);

  return (
    <div className="dashboard-wrapper">
      <div className="header mb-4">
        <h1>People nearby</h1>
        <p>Find people in your organization by interest or skill.</p>
      </div>

      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'peers' ? 'active' : ''}`}
          onClick={() => setActiveTab('peers')}
        >
          Find peers
        </div>
        <div 
          className={`tab ${activeTab === 'learners' ? 'active' : ''}`}
          onClick={() => setActiveTab('learners')}
        >
          Find mentors
        </div>
      </div>

      <div className="card mb-4 dashboard-filter-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <DomainSelector 
            multiple={false} 
            selectedDomains={selectedDomain ? [selectedDomain] : []}
            onChange={(domain) => setSelectedDomain(domain)} 
          />
        </div>
        <p className="text-sm text-muted mb-1" style={{ flex: 1 }}>
          Choose a domain to see {activeTab === 'peers' ? 'people with similar interests' : 'people open to mentoring'}.
        </p>
      </div>

      {loading ? (
        <div className="text-center p-4">Looking around...</div>
      ) : users.length > 0 ? (
        <div className="grid">
          {users.map(user => (
            <UserCard key={user._id || user.userId} user={user} />
          ))}
        </div>
      ) : (
        <div className="text-center p-4 card text-muted">
          {selectedDomain 
            ? `No ${activeTab === 'peers' ? 'peers' : 'mentors'} found for ${selectedDomain}.`
            : "Choose a domain when you are ready."}
        </div>
      )}

      <div className="mt-4">
        <div className="header mb-2">
          <h1 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>Recently viewed people</h1>
          <p>Profiles your community has been checking out.</p>
        </div>

        {popularLoading ? (
          <div className="text-center p-4 card text-muted">Loading people...</div>
        ) : popularUsers.length > 0 ? (
          <div className="grid">
            {popularUsers.map(user => (
              <UserCard key={user.userId} user={user} />
            ))}
          </div>
        ) : (
          <div className="text-center p-4 card text-muted">
            No profile visits yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
