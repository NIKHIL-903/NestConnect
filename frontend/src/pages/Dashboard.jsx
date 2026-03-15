import React, { useState, useEffect } from 'react';
import UserCard from '../components/UserCard';
import DomainSelector from '../components/DomainSelector';
import { getDiscoverUsers } from '../api/api';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('peers'); // peers or learners
  const [selectedDomain, setSelectedDomain] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
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
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedDomain, activeTab]);

  return (
    <div className="dashboard-wrapper">
      <div className="header mb-4">
        <h1>Dashboard</h1>
        <p>Connect with your community</p>
      </div>

      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'peers' ? 'active' : ''}`}
          onClick={() => setActiveTab('peers')}
        >
          Find Peers
        </div>
        <div 
          className={`tab ${activeTab === 'learners' ? 'active' : ''}`}
          onClick={() => setActiveTab('learners')}
        >
          Find Mentors
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
          Select a domain to see {activeTab === 'peers' ? 'people with similar interests' : 'available mentors'}.
        </p>
      </div>

      {loading ? (
        <div className="text-center p-4">Loading...</div>
      ) : users.length > 0 ? (
        <div className="grid">
          {users.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ) : (
        <div className="text-center p-4 card text-muted">
          {selectedDomain 
            ? `No ${activeTab === 'peers' ? 'peers' : 'mentors'} found for ${selectedDomain}.`
            : "Select a domain to get started."}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
