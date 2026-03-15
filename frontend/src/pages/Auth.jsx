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
      await login({ email: identifier, password });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  };

  const handleNewUser = async (e) => {
    e.preventDefault();
    setOrgCodeError('');
    if (!orgCode) {
      setOrgCodeError('Organization Code is required');
      return;
    }
    
    setIsCheckingOrg(true);
    try {
      const res = await checkOrgCode(orgCode);
      if (res.data?.data?.valid) {
        navigate('/register', { state: { orgCode } });
      } else {
        setOrgCodeError('Invalid Organization Code. Please try again.');
      }
    } catch (error) {
      console.error(error);
      setOrgCodeError('Error validating organization code');
    } finally {
      setIsCheckingOrg(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card p-4" style={{ width: '100%', maxWidth: '500px' }}>
        <div className="text-center mb-4">
          <h1 style={{ color: 'var(--primary-accent)', fontSize: '2.2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            NestConnect
          </h1>
          <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            Connect with your neighbours within your Residential Community
          </p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '500', color: '#fff' }}>
            {isLogin ? 'Welcome Back' : 'Join Your Community'}
          </h2>
        </div>
        
        <div className="flex justify-center gap-2 mb-4">
          <button 
            className={`btn ${isLogin ? '' : 'secondary'}`} 
            onClick={() => setIsLogin(true)}
            style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
            type="button"
          >
            Login
          </button>
          <button 
            className={`btn ${!isLogin ? '' : 'secondary'}`} 
            onClick={() => setIsLogin(false)}
            style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
            type="button"
          >
            New User
          </button>
        </div>

        {/* Google Auth Button */}
        <div className="mb-4">
          <button 
            className="btn secondary" 
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px',
              border: '1px solid #555',
              padding: '0.8rem'
            }}
            type="button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
          <span className="text-muted text-sm">or</span>
          <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="flex-col gap-2">
            <div>
              <input 
                className="input-field" 
                type="text" 
                placeholder="Email" 
                style={{ padding: '0.8rem' }}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div>
              <input 
                className="input-field" 
                type="password" 
                placeholder="Password"
                style={{ padding: '0.8rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn mt-2" type="submit" style={{ padding: '0.8rem' }}>Login</button>
          </form>
        ) : (
          <form onSubmit={handleNewUser} className="flex-col gap-2">
            <div>
              <p className="text-sm text-muted mb-2 text-center">
                Enter your community's organization code to join.
              </p>
              <input 
                className="input-field" 
                type="text" 
                placeholder="Organization Code"
                style={{ padding: '0.8rem', borderColor: orgCodeError ? '#f87171' : undefined }}
                value={orgCode}
                onChange={(e) => {
                   setOrgCode(e.target.value);
                   setOrgCodeError('');
                }}
                required
              />
              {orgCodeError && <p className="text-sm mt-1 text-center" style={{ color: '#f87171', margin: '0' }}>{orgCodeError}</p>}
            </div>
            <button className="btn mt-2" type="submit" disabled={isCheckingOrg} style={{ padding: '0.8rem' }}>
               {isCheckingOrg ? 'Validating...' : 'Continue Registration'}
            </button>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted mb-1">
                Don't have an organization code?
              </p>
              <Link to="/register-org" style={{ color: 'var(--primary-accent)' }}>
                Register your organization
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
