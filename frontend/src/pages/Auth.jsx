import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkOrgCode } from '../api/api';

const Auth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  // Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // New User State
  const [orgCode, setOrgCode] = useState('');
  const [orgCodeError, setOrgCodeError] = useState('');
  const [isCheckingOrg, setIsCheckingOrg] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login({ identifier, password });
      navigate('/discover');
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  };

  const handleNewUser = async (e) => {
    e.preventDefault();
    setOrgCodeError('');
    if (!orgCode) {
      setOrgCodeError('Organization code is required');
      return;
    }
    
    setIsCheckingOrg(true);
    try {
      const res = await checkOrgCode(orgCode);
      if (res.data?.data?.valid) {
        navigate('/register', { state: { orgCode } });
      } else {
        setOrgCodeError('That organization code does not look right.');
      }
    } catch (error) {
      console.error(error);
      setOrgCodeError('Error validating organization code');
    } finally {
      setIsCheckingOrg(false);
    }
  };

  const features = [
    {
      title: 'Discover People with similar interests',
      text: 'Meet neighbours with skills and hobbies like yours.'
    },
    {
      title: 'Find mentors nearby',
      text: 'Learn from people already in your community.'
    },
    {
      title: 'Connect with people within your community',
      text: 'Start trusted conversations with familiar people.'
    }
  ];

  return (
    <div className="auth-page">
      <section className="auth-intro" aria-labelledby="auth-title">
        <div>
          <h1 id="auth-title">NestConnect</h1>
          <p className="auth-subtitle">
            Meet mentors and peers within your Community
          </p>
          <Link to="/register-org" className="auth-community-link">
            Register Your Community
          </Link>
        </div>

        <div className="auth-feature-grid">
          {features.map(feature => (
            <article className="auth-feature-card" key={feature.title}>
              <div>
                <h2>{feature.title}</h2>
                <p>{feature.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card auth-card" aria-label={isLogin ? 'Login form' : 'Join community form'}>
        <div className="auth-card-heading">
          <h2>{isLogin ? 'Welcome back' : 'New here'}</h2>
          <p className="text-muted">
            {isLogin
              ? 'Login to continue discovering people around you.'
              : 'Join your community using your community code.'}
          </p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication options">
          <button 
            className={`btn ${isLogin ? '' : 'secondary'}`} 
            onClick={() => setIsLogin(true)}
            type="button"
          >
            Login
          </button>
          <button 
            className={`btn ${!isLogin ? '' : 'secondary'}`} 
            onClick={() => setIsLogin(false)}
            type="button"
          >
            New here
          </button>
        </div>

        {isLogin ? (
          <>
          <form onSubmit={handleLogin} className="auth-form">
            <div>
              <label className="auth-label" htmlFor="login-identifier">Email or username</label>
              <input 
                id="login-identifier"
                className="input-field" 
                type="text" 
                placeholder="Email or username" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="auth-label" htmlFor="login-password">Password</label>
              <input 
                id="login-password"
                className="input-field" 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn auth-submit" type="submit">Login</button>
          </form>
          <p className="auth-demo-text">
            To test this application use 
            <br></br>
            username: <strong>test</strong>
            <br />
            password: <strong>Test@123</strong>
          </p>
          </>
        ) : (
          <form onSubmit={handleNewUser} className="auth-form">
            <div>
              <label className="auth-label" htmlFor="org-code">Community code</label>
              <input 
                id="org-code"
                className="input-field" 
                type="text" 
                placeholder="Code"
                style={{ borderColor: orgCodeError ? '#f87171' : undefined }}
                value={orgCode}
                onChange={(e) => {
                   setOrgCode(e.target.value);
                   setOrgCodeError('');
                }}
                required
              />
              {orgCodeError && <p className="text-sm mt-1 text-center" style={{ color: '#f87171', margin: '0' }}>{orgCodeError}</p>}
              <p className="auth-demo-text" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                Test Code: <strong>79DC50</strong>
              </p>
            </div>
            <button className="btn auth-submit" type="submit" disabled={isCheckingOrg}>
               {isCheckingOrg ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default Auth;
