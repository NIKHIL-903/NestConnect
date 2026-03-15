import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DomainSelector from '../components/DomainSelector';
import SkillInput from '../components/SkillInput';
import { updateProfile, checkUserId, getOrganization } from '../api/api';
import { useAuth } from '../context/AuthContext';
import profilePlaceholder from '../assets/profile.png';

const UpdateProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Assume we have the user in context if they are reaching this protected route

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    bio: '',
    occupation: '',
    block: '',
    floor: '',
    doorNo: '',
    achievements: ''
  });

  const [selectedDomains, setSelectedDomains] = useState([]);
  const [domainSkills, setDomainSkills] = useState({});
  const [openToMentor, setOpenToMentor] = useState('No');
  
  // Mentor domains state
  const [mentorSelectedDomains, setMentorSelectedDomains] = useState([]);
  const [mentorDomainSkills, setMentorDomainSkills] = useState({});

  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [orgName, setOrgName] = useState('');

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.userId || '',
        name: user.name || '',
        bio: user.bio || '',
        occupation: user.occupation || '',
        block: user.block || '',
        floor: user.floor || '',
        doorNo: user.doorNo || '',
        achievements: user.achievements || ''
      });

      if (user.profileImage) {
        setImagePreview(user.profileImage);
      }

      // Fetch org name
      if (user.orgCode) {
        (async () => {
          try {
            const orgRes = await getOrganization(user.orgCode);
            setOrgName(orgRes.data.data.orgName || '');
          } catch {
            setOrgName('');
          }
        })();
      }

      setOpenToMentor(user.openToMentor ? 'Yes' : 'No');

      if (user.domains && Array.isArray(user.domains)) {
        const dNames = user.domains.map(d => d.name);
        setSelectedDomains(dNames);
        const dSkills = {};
        user.domains.forEach(d => {
          dSkills[d.name] = d.skills || [];
        });
        setDomainSkills(dSkills);
      }

      if (user.mentorDomains && Array.isArray(user.mentorDomains)) {
        const mdNames = user.mentorDomains.map(d => d.name);
        setMentorSelectedDomains(mdNames);
        const mdSkills = {};
        user.mentorDomains.forEach(d => {
          mdSkills[d.name] = d.skills || [];
        });
        setMentorDomainSkills(mdSkills);
      }

      setLoading(false);
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'username' && e.target.value !== user?.userId) {
       setUsernameStatus('idle');
    }
  };

  const handleSkillChange = (domain, skillsArray) => {
    setDomainSkills({ ...domainSkills, [domain]: skillsArray });
  };

  const getAllSkills = () => {
    const all = [];
    Object.values(domainSkills).forEach(skillsArray => {
      all.push(...skillsArray);
    });
    return [...new Set(all)]; // unique
  };

  const handleMentorSkillChange = (domain, skillsArray) => {
    setMentorDomainSkills({ ...mentorDomainSkills, [domain]: skillsArray });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCheckUsername = async () => {
    if (!formData.username.trim() || formData.username === user?.userId) return;
    setUsernameStatus('checking');
    try {
      const res = await checkUserId(formData.username);
      if (res.data.data.available) {
        setUsernameStatus('available');
      } else {
        setUsernameStatus('unavailable');
      }
    } catch (error) {
      console.error('Error checking username', error);
      setUsernameStatus('idle');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.username !== user?.userId && usernameStatus !== 'available') {
      alert('Please check if the new username is available first');
      return;
    }
    
    // Format domains and mentorDomains to match backend expectation
    const formattedDomains = selectedDomains.map(d => ({
      name: d,
      skills: domainSkills[d] || []
    }));

    const formattedMentorDomains = mentorSelectedDomains.map(d => ({
      name: d,
      skills: mentorDomainSkills[d] || []
    }));

    try {
      // Use FormData since backend expects multipart/form-data for profileImage
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      formDataToSend.append('domains', JSON.stringify(formattedDomains));
      formDataToSend.append('openToMentor', openToMentor === 'Yes' ? 'true' : 'false');
      
      if (openToMentor === 'Yes') {
         formDataToSend.append('mentorDomains', JSON.stringify(formattedMentorDomains));
      } else {
         formDataToSend.append('mentorDomains', JSON.stringify([]));
      }

      // Only append profile image if a new one was selected
      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }
      
      if (formData.username && formData.username !== user?.userId) {
         formDataToSend.append('userId', formData.username);
      }

      await updateProfile(formDataToSend);
      // Let's redirect back to profile directly
      navigate('/profile/me');
      
      // A full page reload might be good to resync local context user fast, or window.location
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Update profile failed');
      }
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading user details...</div>;
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '800px' }}>
      <div className="card p-4">
        <h2 className="mb-4 text-center">Update Your Profile</h2>
        
        <form onSubmit={handleSubmit}>
          
          <div className="flex justify-center mb-4">
            <label style={{ cursor: 'pointer' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                style={{ display: 'none' }} 
              />
              <img
                src={imagePreview || profilePlaceholder}
                alt={user?.name || 'Profile'}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px dashed #555'
                }}
              />
            </label>
          </div>

          <div className="grid">
            <div style={{ position: 'relative' }}>
              <label className="text-sm text-muted">Username</label>
              <div className="flex gap-2">
                <input 
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="input-field" 
                  style={{ marginBottom: 0 }}
                  required 
                />
                <button 
                  type="button" 
                  className="btn" 
                  onClick={handleCheckUsername}
                  disabled={!formData.username.trim() || formData.username === user?.userId || usernameStatus === 'checking' || usernameStatus === 'available'}
                >
                  {usernameStatus === 'checking' ? '...' : usernameStatus === 'available' ? 'Verified' : 'Verify'}
                </button>
              </div>
              {usernameStatus === 'available' && <p className="text-sm mt-1" style={{ color: '#4ade80', margin: 0 }}>Username is available</p>}
              {usernameStatus === 'unavailable' && <p className="text-sm mt-1" style={{ color: '#f87171', margin: 0 }}>Try another</p>}
              {formData.username === user?.userId && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', margin: 0 }}>Your current username</p>}
            </div>
            <div>
              <label className="text-sm text-muted">Org Code</label>
              <input 
                value={user?.orgCode || ''}
                className="input-field" 
                disabled 
                style={{ cursor: 'not-allowed', opacity: 0.7 }}
              />
            </div>
            <div>
              <label className="text-sm text-muted">Org Name</label>
              <input 
                value={orgName || 'Fetching...'}
                className="input-field" 
                disabled 
                style={{ cursor: 'not-allowed', opacity: 0.7 }}
              />
            </div>
            <div>
              <label className="text-sm text-muted">Full Name</label>
              <input 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field" 
                required 
              />
            </div>
            <div>
              <label className="text-sm text-muted">Email</label>
              <input 
                value={user?.email || ''}
                className="input-field" 
                disabled 
                style={{ cursor: 'not-allowed', opacity: 0.7 }}
              />
            </div>
            <div>
              <label className="text-sm text-muted">Occupation</label>
              <input 
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                className="input-field" 
                placeholder="e.g. Software Engineer, Student"
                required 
              />
            </div>
            <div>
              <label className="text-sm text-muted">Block / Tower / Road No</label>
              <input 
                name="block"
                value={formData.block}
                onChange={handleInputChange}
                className="input-field" 
                placeholder="e.g. A, B, Tower 1"
                required 
              />
            </div>
            <div>
              <label className="text-sm text-muted">Floor</label>
              <input 
                name="floor"
                type="text"
                value={formData.floor}
                onChange={handleInputChange}
                className="input-field" 
                placeholder="e.g. Ground, 4, 4A"
                required 
              />
            </div>
            <div>
              <label className="text-sm text-muted">Door no / House no</label>
              <input 
                name="doorNo"
                value={formData.doorNo}
                onChange={handleInputChange}
                className="input-field" 
                placeholder="e.g. 402"
                required 
              />
            </div>
          </div>
          
          <div className="mb-2 mt-2">
            <label className="text-sm text-muted">Bio</label>
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="input-field" 
              rows="3"
            ></textarea>
          </div>

          <div className="mb-2">
            <label className="text-sm text-muted">Achievements (Optional)</label>
            <textarea 
              name="achievements"
              value={formData.achievements}
              onChange={handleInputChange}
              className="input-field" 
              placeholder="e.g. Won Hackathon 2023, Published a paper on AI"
              rows="2"
            ></textarea>
          </div>

          <div className="mb-4 mt-4">
            <h3 className="mb-2">Domains of Interest</h3>
            <DomainSelector 
              selectedDomains={selectedDomains} 
              onChange={setSelectedDomains} 
            />
            
            {selectedDomains.length > 0 && (
              <div className="mt-2 p-2" style={{ background: 'var(--bg-color)', borderRadius: '4px' }}>
                {selectedDomains.map(domain => (
                  <SkillInput 
                    key={domain} 
                    domain={domain} 
                    skills={domainSkills[domain] || []}
                    onChange={(skills) => handleSkillChange(domain, skills)}
                  />
                ))}
              </div>
            )}
          </div>

          {getAllSkills().length > 0 && (
            <div className="mb-4 mt-4" style={{ borderTop: '1px solid #333', paddingTop: '2rem' }}>
              <div className="flex items-center gap-2 mb-2">
                <h3 style={{ margin: 0 }}>Open to Mentor?</h3>
                <select 
                  className="input-field" 
                  style={{ width: '120px', marginBottom: 0 }}
                  value={openToMentor}
                  onChange={(e) => setOpenToMentor(e.target.value)}
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </div>

              {openToMentor === 'Yes' && (
                <div className="mt-4">
                  <p className="text-sm text-muted mb-2">Select to add your Mentor Domains and Skills:</p>
                  <DomainSelector 
                    selectedDomains={mentorSelectedDomains} 
                    onChange={setMentorSelectedDomains} 
                  />
                  
                  {mentorSelectedDomains.length > 0 && (
                    <div className="mt-2 p-2" style={{ background: 'var(--bg-color)', borderRadius: '4px' }}>
                      {mentorSelectedDomains.map(domain => (
                        <SkillInput 
                          key={domain} 
                          domain={domain} 
                          skills={mentorDomainSkills[domain] || []}
                          onChange={(skills) => handleMentorSkillChange(domain, skills)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-4">
            <button type="button" className="btn" style={{ flex: 1, background: 'transparent', border: '1px solid #555' }} onClick={() => navigate('/profile/me')}>Cancel</button>
            <button type="submit" className="btn" style={{ flex: 1 }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
