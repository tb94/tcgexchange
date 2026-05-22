import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api';

export default function Profile() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [editErr, setEditErr] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const res = await apiRequest('/auth/me');
      setMe(res.user || res);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal() {
    setAvatarUrl(me?.avatarUrl || '');
    setEditErr('');
    setEditOpen(true);
  }

  function closeEditModal() {
    setEditOpen(false);
    setAvatarUrl('');
    setEditErr('');
    setEditSaving(false);
  }

  async function saveProfileInfo() {
    setEditErr('');
    setEditSaving(true);
    try {
      const res = await apiRequest('/auth/me/avatar', {
        method: 'PUT',
        body: { avatarUrl: avatarUrl || null }
      });
      setMe(res.user || me);
      closeEditModal();
    } catch (e) {
      setEditErr(e.message);
    } finally {
      setEditSaving(false);
    }
  }

  function closePasswordModal() {
    setPasswordOpen(false);
    setCurPw('');
    setNewPw('');
    setPwErr('');
    setPwSaving(false);
  }

  async function changePassword() {
    setPwErr('');
    setPwSaving(true);
    try {
      await apiRequest('/auth/me/password', {
        method: 'PUT',
        body: { currentPassword: curPw, newPassword: newPw }
      });
      closePasswordModal();
      alert('Password changed');
    } catch (e) {
      setPwErr(e.message);
    } finally {
      setPwSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid gap-4">
      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-bold">Profile</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Account overview</div>
          </div>
          <button className="btn btn-primary" onClick={load} disabled={loading}>Refresh</button>
        </div>

        {loading && <div className="mt-4 text-slate-600 dark:text-slate-400">Loading…</div>}
        {err && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm">{err}</div>}

        {me && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-900/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <div className="font-bold">Current user information</div>
                <button className="btn btn-ghost" type="button" onClick={openEditModal}>Edit Info</button>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-xl border border-slate-900/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Username</div>
                  <div className="mt-1 text-lg font-bold">{me.username}</div>
                </div>
                <div className="rounded-xl border border-slate-900/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</div>
                  <div className="mt-1 font-mono">{me.id}</div>
                </div>
                <div className="rounded-xl border border-slate-900/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avatar</div>
                  {me.avatarUrl ? (
                    <div className="mt-2 flex items-center gap-3">
                      <img src={me.avatarUrl} alt="Avatar" className="h-12 w-12 rounded-full border border-white/10 object-cover" />
                      <span className="break-all text-slate-600 dark:text-slate-400">{me.avatarUrl}</span>
                    </div>
                  ) : (
                    <div className="mt-1 text-slate-600 dark:text-slate-400">No avatar set</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {me.role === 'admin' && (
                <div className="rounded-2xl border border-slate-900/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="font-bold">Admin portal</div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    You have admin access. Use the button below to manage users in the admin portal.
                  </div>
                  <Link className="btn btn-primary mt-4" to="/app/admin">
                    Open admin portal
                  </Link>
                </div>
              )}

              <div className="rounded-2xl border border-slate-900/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="font-bold">Security</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Profile details are read-only here. Use the button below if you need to update your password.
                </div>
                <button className="btn btn-primary mt-4" onClick={() => setPasswordOpen(true)}>
                  Change password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/50" onClick={closeEditModal} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-900/10 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-[#0b1220]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold">Edit Info</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Update profile fields. More options can live here later.</div>
              </div>
              <button className="btn btn-ghost" type="button" onClick={closeEditModal}>Close</button>
            </div>

            {editErr && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm">{editErr}</div>}

            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Avatar URL</label>
                <input
                  className="input mt-1"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              {avatarUrl && (
                <div className="rounded-xl border border-slate-900/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Preview</div>
                  <img src={avatarUrl} alt="Avatar preview" className="h-16 w-16 rounded-full border border-white/10 object-cover" />
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-ghost" type="button" onClick={closeEditModal} disabled={editSaving}>Cancel</button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => saveProfileInfo().catch(() => {})}
                disabled={editSaving}
              >
                {editSaving ? 'Saving…' : 'Save info'}
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/50" onClick={closePasswordModal} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-900/10 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-[#0b1220]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold">Change password</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Enter your current password and a new one.</div>
              </div>
              <button className="btn btn-ghost" type="button" onClick={closePasswordModal}>Close</button>
            </div>

            {pwErr && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm">{pwErr}</div>}

            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Current password</label>
                <input className="input mt-1" type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">New password</label>
                <input className="input mt-1" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-ghost" type="button" onClick={closePasswordModal} disabled={pwSaving}>Cancel</button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => changePassword().catch(() => {})}
                disabled={pwSaving || !curPw || !newPw}
              >
                {pwSaving ? 'Saving…' : 'Save password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
