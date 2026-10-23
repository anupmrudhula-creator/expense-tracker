import { useState } from 'react';
import { ArrowRight, Lock, Mail, Wallet } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const message = await login(email, password);
    setError(message ?? '');
    setBusy(false);
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
          <Mail size={18} />
          <input
            className="bare"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={18} />
        </button>
      </form>
    </main>
  );
}
