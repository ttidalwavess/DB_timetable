import React, { useState } from 'react';
import './LoginModal.css';

export default function LoginModal({ onLogin, onClose }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        throw new Error('Неверный логин или пароль');
      }

      const data = await res.json();
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lm-overlay">
      <div className="lm-modal">
        <div className="lm-header">
          <h2>Авторизация</h2>
          <button className="lm-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="lm-form">
          {error && <div className="lm-error">{error}</div>}
          
          <div className="lm-field">
            <label>Логин</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          
          <div className="lm-field">
            <label>Пароль</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="lm-submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
