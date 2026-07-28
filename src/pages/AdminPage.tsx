import { useState, useEffect, type FormEvent } from 'react';
import { useAuth, type Profile } from '../lib/auth';
import { supabase } from '../supabase';

const allPages = [
  { id: 'home', label: 'Home' },
  { id: 'create', label: 'Create' },
  { id: 'projects', label: 'Projects' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'chat', label: 'Chat' },
  { id: 'chat-buddy', label: 'Chat Buddy' },
  { id: 'files', label: 'My Files' },
  { id: 'teams', label: 'Teams' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
];

export function AdminPage() {
  const { isAdmin, pageSettings, togglePageVisibility, createUser, deleteUser, profile, signOut } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'pages'>('users');

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as Profile[]);
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setLoading(true);
    const { error } = await createUser(newEmail, newPassword, newRole);
    if (error) {
      setCreateError(error.message.includes('already registered') ? 'Email already registered' : error.message);
    } else {
      setCreateSuccess(`User ${newEmail} created successfully`);
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      await fetchUsers();
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Delete user ${email}?`)) return;
    const { error } = await deleteUser(userId);
    if (!error) await fetchUsers();
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-danger/10 border border-danger/20 rounded-2xl p-8 text-center">
          <p className="text-sm text-danger font-medium">Access Denied</p>
          <p className="text-xs text-text-muted mt-1">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header with logout */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Admin Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">Manage users and page visibility</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-text-muted">{profile?.email}</div>
          <button
            onClick={signOut}
            className="h-9 px-4 bg-bg-surface border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-bg-sidebar transition-all flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-bg-surface border border-border rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
            activeTab === 'users' ? 'bg-accent text-selected-text' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
            activeTab === 'pages' ? 'bg-accent text-selected-text' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Page Visibility
        </button>
      </div>

      {/* User Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Create user form */}
          <div className="bg-bg-sidebar border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-primary">Create New User</h2>
              <button
                onClick={() => setShowCreateUser(!showCreateUser)}
                className="h-8 px-3 bg-accent text-selected-text rounded-lg text-xs font-semibold hover:bg-accent-hover transition-all"
              >
                {showCreateUser ? 'Cancel' : '+ Add User'}
              </button>
            </div>

            {showCreateUser && (
              <form onSubmit={handleCreateUser} className="space-y-3">
                {createError && (
                  <div className="px-4 py-2 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">{createError}</div>
                )}
                {createSuccess && (
                  <div className="px-4 py-2 bg-success/10 border border-success/20 rounded-xl text-sm text-success">{createSuccess}</div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 placeholder:text-text-muted/60"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Password (min 6 chars)"
                    required
                    minLength={6}
                    className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 placeholder:text-text-muted/60"
                  />
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 px-5 bg-accent text-selected-text rounded-xl font-semibold text-sm hover:bg-accent-hover transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </form>
            )}
          </div>

          {/* Users list */}
          <div className="bg-bg-sidebar border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">All Users ({users.length})</h2>
            </div>
            <div className="divide-y divide-border">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    u.role === 'admin' ? 'bg-accent/15 text-accent' : 'bg-bg-surface text-text-muted'
                  }`}>
                    {u.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{u.email}</div>
                    <div className="text-[11px] text-text-muted">{new Date(u.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    u.role === 'admin' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-bg-surface text-text-muted border border-border'
                  }`}>
                    {u.role}
                  </span>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.email)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/5 transition-all"
                    title="Delete user"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Page Visibility */}
      {activeTab === 'pages' && (
        <div className="bg-bg-sidebar border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Toggle Page Visibility for Users</h2>
            <p className="text-[11px] text-text-muted mt-0.5">Admin always sees all pages. These settings control what regular users can access.</p>
          </div>
          <div className="divide-y divide-border">
            {allPages.map(page => {
              const setting = pageSettings.find(p => p.page_id === page.id);
              const visible = setting?.visible ?? true;
              return (
                <div key={page.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-bg-surface flex items-center justify-center">
                    <PageIcon name={page.id} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">{page.label}</div>
                  </div>
                  <button
                    onClick={() => togglePageVisibility(page.id)}
                    className={`relative w-10 h-5.5 rounded-full transition-all duration-200 ${
                      visible ? 'bg-accent' : 'bg-border'
                    }`}
                    style={{ height: '22px' }}
                  >
                    <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-all duration-200 ${
                      visible ? 'left-[calc(100%-20px)]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PageIcon({ name }: { name: string }) {
  const s = { width: 14, height: 14, viewBox: '0 0 24 24' as const, fill: 'none' as const, stroke: '#727272', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'home': return <svg {...s}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case 'create': return <svg {...s}><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /></svg>;
    case 'projects': return <svg {...s}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></svg>;
    case 'tickets': return <svg {...s}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M9 12h6" /></svg>;
    case 'tasks': return <svg {...s}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
    case 'chat': return <svg {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case 'chat-buddy': return <svg {...s}><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /></svg>;
    case 'files': return <svg {...s}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>;
    case 'teams': return <svg {...s}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'analytics': return <svg {...s}><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>;
    case 'settings': return <svg {...s}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    default: return <svg {...s}><circle cx="12" cy="12" r="3" /></svg>;
  }
}
