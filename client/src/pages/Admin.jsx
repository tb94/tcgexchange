import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

function UserRow({ user, onSave, onDeactivate, onActivate, onDelete }) {
  const [username, setUsername] = useState(user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [role, setRole] = useState(user.role || 'user');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(user.id, { username, avatarUrl: avatarUrl || null, role });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-900/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="grid gap-2 md:grid-cols-6">
        <div>
          <div className="text-xs text-slate-500">ID</div>
          <div className="font-mono text-sm">{user.id}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-xs text-slate-500">Username</div>
          <input className="input mt-1" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <div className="text-xs text-slate-500">Role</div>
          <select className="input mt-1" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div>
          <div className="text-xs text-slate-500">Status</div>
          <div className="mt-2 text-sm font-semibold">{user.isActive ? 'Active' : 'Deactivated'}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-xs text-slate-500">Avatar URL</div>
          <input className="input mt-1" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn btn-primary" type="button" onClick={() => save().catch((e) => alert(e.message))} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {user.isActive ? (
          <button className="btn btn-ghost" type="button" onClick={() => onDeactivate(user.id).catch((e) => alert(e.message))}>
            Deactivate
          </button>
        ) : (
          <button className="btn btn-ghost" type="button" onClick={() => onActivate(user.id).catch((e) => alert(e.message))}>
            Activate
          </button>
        )}
        <button className="btn btn-ghost" type="button" onClick={() => onDelete(user.id).catch((e) => alert(e.message))}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newAvatar, setNewAvatar] = useState('');

  async function loadUsers() {
    setLoading(true);
    setErr('');
    try {
      const res = await apiRequest('/admin/users');
      setUsers(res.users || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function createUser() {
    await apiRequest('/admin/users', {
      method: 'POST',
      body: {
        username: newUsername,
        password: newPassword,
        role: newRole,
        avatarUrl: newAvatar || null
      }
    });
    setNewUsername('');
    setNewPassword('');
    setNewRole('user');
    setNewAvatar('');
    await loadUsers();
  }

  async function saveUser(id, payload) {
    await apiRequest(`/admin/users/${id}`, { method: 'PUT', body: payload });
    await loadUsers();
  }

  async function deactivateUser(id) {
    const ok = window.confirm('Deactivate this user? They will no longer be able to log in.');
    if (!ok) return;
    await apiRequest(`/admin/users/${id}/deactivate`, { method: 'POST', body: { confirm: true } });
    await loadUsers();
  }

  async function activateUser(id) {
    await apiRequest(`/admin/users/${id}/activate`, { method: 'POST', body: {} });
    await loadUsers();
  }

  async function deleteUser(id) {
    const ok = window.confirm('Delete this user permanently? This cannot be undone.');
    if (!ok) return;
    await apiRequest(`/admin/users/${id}`, { method: 'DELETE', body: { confirm: true } });
    await loadUsers();
  }

  return (
    <div className="grid gap-4">
      <div className="card">
        <div className="text-lg font-bold">Admin Portal — User Management</div>
        <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Create, edit, deactivate, activate, and delete users.</div>

        {err && <div className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm">{err}</div>}

        <div className="mt-4 rounded-xl border border-slate-900/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="font-semibold">Create user</div>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            <input className="input" placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            <input className="input" type="password" placeholder="Password (min 8)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <select className="input" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <input className="input" placeholder="Avatar URL (optional)" value={newAvatar} onChange={(e) => setNewAvatar(e.target.value)} />
          </div>
          <button className="btn btn-primary mt-3" type="button" onClick={() => createUser().catch((e) => alert(e.message))}>Create user</button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold">Users</div>
          <button className="btn btn-ghost" type="button" onClick={() => loadUsers().catch(() => {})}>Refresh</button>
        </div>

        {loading ? (
          <div className="mt-3 text-sm text-slate-500">Loading…</div>
        ) : (
          <div className="mt-3 grid gap-3">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onSave={saveUser}
                onDeactivate={deactivateUser}
                onActivate={activateUser}
                onDelete={deleteUser}
              />
            ))}
            {!users.length && <div className="text-sm text-slate-500">No users found.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
