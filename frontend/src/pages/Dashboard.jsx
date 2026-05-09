import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import UserCard from '../components/UserCard';
import DomainSelector from '../components/DomainSelector';
import { getDiscoverUsers, getPopularUsers } from '../api/api';


const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'learners' ? 'learners' : 'peers';
  const [activeTab, setActiveTab] = useState(initialTab); // peers or learners
  const [selectedDomain, setSelectedDomain] = useState(searchParams.get('domain') || '');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popularUsers, setPopularUsers] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);

  useEffect(() => {
    const nextTab = searchParams.get('tab') === 'learners' ? 'learners' : 'peers';
    const nextDomain = searchParams.get('domain') || '';

    setActiveTab(nextTab);
    setSelectedDomain(nextDomain);
  }, [searchParams]);

  const updateDiscoverFilters = (nextValues) => {
    const nextTab = nextValues.activeTab ?? activeTab;
    const nextDomain = nextValues.selectedDomain ?? selectedDomain;
    const params = new URLSearchParams();

    if (nextDomain) params.set('domain', nextDomain);
    if (nextTab !== 'peers') params.set('tab', nextTab);

    setSearchParams(params, { replace: true });
  };

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
        <h1>{selectedDomain ? `Discover People in ${selectedDomain}` : 'Discover People'}</h1>
        <p>Find people in your organization by interest or skill.</p>
      </div>

      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'peers' ? 'active' : ''}`}
          onClick={() => updateDiscoverFilters({ activeTab: 'peers' })}
        >
          Find peers
        </div>
        <div 
          className={`tab ${activeTab === 'learners' ? 'active' : ''}`}
          onClick={() => updateDiscoverFilters({ activeTab: 'learners' })}
        >
          Find mentors
        </div>
      </div>

      <div className="card mb-4 dashboard-filter-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <DomainSelector 
            multiple={false} 
            selectedDomains={selectedDomain ? [selectedDomain] : []}
            onChange={(domain) => updateDiscoverFilters({ selectedDomain: domain })} 
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
      ) : selectedDomain ? (
        <div className="text-center p-4 card text-muted">
          {`No ${activeTab === 'peers' ? 'peers' : 'mentors'} found for ${selectedDomain}.`}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="header mb-2">
          <h1 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>Most Viewed People in your Community</h1>
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
