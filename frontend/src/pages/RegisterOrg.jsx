import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerOrg } from '../api/api';

const RegisterOrg = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await registerOrg({ orgName: name, city, description });
      const code = res.data.data.orgCode;
      setGeneratedCode(code);
      
      setTimeout(() => {
        navigate('/register', { state: { orgCode: code } });
      }, 3000);
      
    } catch (err) {
      console.error(err);
      alert('Failed to register organization');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="card p-4">
        <h2 className="text-center mb-1">Register Your Community</h2>

        {!generatedCode ? (
          <form onSubmit={handleSubmit}>
            <input 
              className="input-field" 
              type="text" 
              placeholder="Community name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input 
              className="input-field" 
              type="text" 
              placeholder="City or town"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <textarea
              className="input-field"
              placeholder="A short note about the community"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              style={{ marginTop: '0.5rem', resize: 'vertical' }}
            />
            <button className="btn mt-2" type="submit">Create organization</button>
          </form>
        ) : (
          <div className="text-center">
            <h3>Organization created</h3>
            <p className="text-muted mt-2 mb-2">Your organization code is:</p>
            <div className="p-2 mb-2" style={{ 
              background: 'var(--bg-color)', 
              border: '1px solid var(--border-color)',
              fontSize: '1.5rem', 
              letterSpacing: '2px', 
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              {generatedCode}
            </div>
            <p className="text-sm text-muted">Taking you to profile setup...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterOrg;
