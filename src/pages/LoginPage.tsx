import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth';

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError.message.includes('Invalid login') ? 'Invalid email or password' : authError.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text-primary">Sticker Lab</h1>
          <p className="text-sm text-text-muted mt-1">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-sidebar border border-border rounded-2xl p-6 space-y-4">
          {error && (
            <div className="px-4 py-2.5 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">
              {error}
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary w-full focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 placeholder:text-text-muted/60 mt-1.5"
              placeholder="admin@stickerlab.com"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary w-full focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 placeholder:text-text-muted/60 mt-1.5"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-accent text-selected-text rounded-xl font-semibold text-sm hover:bg-accent-hover transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
