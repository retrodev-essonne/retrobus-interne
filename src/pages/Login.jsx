import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { AuthAPI } from '../api/auth';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPwd] = useState('');
  const [error, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken } = useUser();

  const submit = async () => {
    setErr('');
    setLoading(true);
    try {
      const res = await AuthAPI.login({ email: username, password });
      const tok = res?.token || res?.accessToken || res?.jwt;
      if (!tok) throw new Error('Token manquant');
      setToken(tok);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setErr(e.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const key = (e) => e.key === 'Enter' && submit();

  return (
    <div className="login-page">
      <div className="login-banner">
        <img src="/univers_rbe.png" alt="RétroBus Essonne" />
      </div>
      <div className="login-container">
        <div className="login-card">
          <h1>Connexion</h1>
          <div className="login-form">
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={key}
              placeholder="Email"
              autoComplete="username"
              className="login-input"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPwd(e.target.value)}
              onKeyDown={key}
              placeholder="Mot de passe"
              autoComplete="current-password"
              className="login-input"
            />
            {error && <p className="login-error">{error}</p>}
            <button onClick={submit} disabled={loading} className="login-button">
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}