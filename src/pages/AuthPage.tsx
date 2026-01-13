import React, { useState } from 'react';
import { supabase } from '../services/supabase';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else setMessage(`Logged in as ${data.user?.email}`);
  };

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage('Registered successfully. Check your email.');
  };

  return (
    <div className="auth-box">
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      <input
        className="auth-input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="auth-input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={isLogin ? handleLogin : handleRegister}>
        {isLogin ? 'Login' : 'Register'}
      </button>
      <p>
        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
        <span className="auth-link" onClick={() => { setIsLogin(!isLogin); setMessage(''); }}>
          {isLogin ? 'Register' : 'Login'}
        </span>
      </p>
      {message && <p className="auth-message">{message}</p>}
    </div>
  );
};

export default AuthPage;
