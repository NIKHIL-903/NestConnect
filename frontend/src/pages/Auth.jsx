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
