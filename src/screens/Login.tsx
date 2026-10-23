import { useState } from 'react';
import { ArrowRight, Lock, User, Wallet } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(username, password)) setError('Wrong username or password');
  };

  return (
    <main className="login">
      <div className="login-brand">
        <span className="logo">
          <Wallet size={30} strokeWidth={2.2} />
        </span>
        <h1>Our Expenses</h1>
        <p>Track every rupee, together.</p>
      </div>

      <form className="login-card" onSubmit={submit}>
        <label className="search">
          <User size={18} />
          <input
            className="bare"
            autoComplete="username"
            autoCapitalize="none"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="search">
          <Lock size={18} />
          <input
            className="bare"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit">
          Sign in <ArrowRight size={18} />
        </button>
      </form>
    </main>
  );
}
