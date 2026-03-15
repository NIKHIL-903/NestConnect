import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DomainSelector from '../components/DomainSelector';
import SkillInput from '../components/SkillInput';
import { registerUser, checkUserId, checkOrgCode } from '../api/api';
import { useAuth } from '../context/AuthContext';
import profilePlaceholder from '../assets/profile.png';

const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const initialOrgCode = location.state?.orgCode || '';

  const [formData, setFormData] = useState({
    orgCode: initialOrgCode,
    orgName: '',
    name: '',
    email: '',
    password: '',
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

  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle, checking, available, unavailable

  const [orgCodeStatus, setOrgCodeStatus] = useState('idle'); // idle, checking, available, unavailable

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'orgCode') {
      setOrgCodeStatus('idle');
      setFormData(prev => ({ ...prev, orgName: '' })); // reset org name if code changes
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
    if (!username.trim()) return;
    setUsernameStatus('checking');
    try {
      const res = await checkUserId(username);
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

  const handleCheckOrgCode = async () => {
    if (!formData.orgCode.trim()) return;
    setOrgCodeStatus('checking');
    try {
      const res = await checkOrgCode(formData.orgCode);
      if (res.data.data.valid) {
        setOrgCodeStatus('available');
        setFormData(prev => ({ ...prev, orgName: res.data.data.orgName }));
      } else {
        setOrgCodeStatus('unavailable');
        setFormData(prev => ({ ...prev, orgName: '' }));
      }
    } catch (error) {
      console.error('Error checking org code', error);
      setOrgCodeStatus('idle');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (usernameStatus !== 'available') {
      alert('Please check if username is available first');
      return;
    }
    if (orgCodeStatus !== 'available') {
      alert('Please validate your Organization Code first');
      return;
    }
    setIsSubmitting(true);
    
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
      
      formDataToSend.append('userId', username);
      formDataToSend.append('domains', JSON.stringify(formattedDomains));
      formDataToSend.append('openToMentor', openToMentor === 'Yes' ? 'true' : 'false');
      
      if (openToMentor === 'Yes') {
         formDataToSend.append('mentorDomains', JSON.stringify(formattedMentorDomains));
      }

      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }

      console.log('Registering user');
      await register(formDataToSend);
      navigate('/dashboard');
    } catch (err) {
      setIsSubmitting(false);
      console.error(err);
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Registration failed');
      }
    }
  };

  return (
    <>
    {isSubmitting && (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, gap: '1.25rem'
      }}>
        <div style={{
          width: '52px', height: '52px',
          border: '5px solid #333',
          borderTop: '5px solid var(--primary-accent)',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite'
        }} />
        <p style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>Creating your account...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )}
    <div className="page-wrapper" style={{ maxWidth: '800px' }}>
      <div className="card p-4">
        <h2 className="mb-4 text-center">Complete Your Profile</h2>
        
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
                alt="Profile preview"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block'
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
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameStatus('idle');
                  }}
                  className="input-field" 
                  style={{ marginBottom: 0 }}
                  required 
                />
                <button 
                  type="button" 
                  className="btn" 
                  onClick={handleCheckUsername}
                  disabled={!username.trim() || usernameStatus === 'checking'}
                >
                  {usernameStatus === 'checking' ? '...' : 'Check'}
                </button>
              </div>
              {usernameStatus === 'available' && <p className="text-sm mt-1" style={{ color: '#4ade80', margin: 0 }}>Username is available</p>}
              {usernameStatus === 'unavailable' && <p className="text-sm mt-1" style={{ color: '#f87171', margin: 0 }}>Try another</p>}
            </div>
            <div>
              <label className="text-sm text-muted">Org Code</label>
              <div className="flex gap-2">
                <input 
                  name="orgCode"
                  value={formData.orgCode}
                  onChange={handleInputChange}
                  className="input-field" 
                  style={{ marginBottom: 0 }}
                  disabled={orgCodeStatus === 'available'}
                  required 
                />
                <button 
                  type="button" 
                  className="btn" 
                  onClick={handleCheckOrgCode}
                  disabled={!formData.orgCode.trim() || orgCodeStatus === 'checking' || orgCodeStatus === 'available'}
                >
                  {orgCodeStatus === 'checking' ? '...' : orgCodeStatus === 'available' ? 'Verified' : 'Verify'}
                </button>
              </div>
              {orgCodeStatus === 'available' && <p className="text-sm mt-1" style={{ color: '#4ade80', margin: 0 }}>Valid Organization</p>}
              {orgCodeStatus === 'unavailable' && <p className="text-sm mt-1" style={{ color: '#f87171', margin: 0 }}>Invalid code</p>}
            </div>
            <div>
              <label className="text-sm text-muted">Org Name</label>
              <input 
                value={formData.orgName}
                className="input-field"
                disabled
                style={{ cursor: 'not-allowed', opacity: 0.7 }}
                placeholder="Auto-filled after verify"
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
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field" 
                required 
              />
            </div>
            <div>
              <label className="text-sm text-muted">Password</label>
              <input 
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input-field" 
                required 
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
                  <p className="text-sm text-muted mb-2">Select Domains and Skills You want to Mentor:</p>
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

          <button className="btn mt-4" type="submit">Complete Registration</button>
        </form>
      </div>
    </div>
    </>
  );
};

export default Register;
