import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest, clearToken, getToken } from './api';
import ThemeToggle from './components/ThemeToggle.jsx';
import { useTheme } from './theme';
import { useCardSize } from './cardSize.jsx';

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `btn btn-ghost ${isActive ? 'ring-4 ring-neonCyan/10 border-neonCyan/50' : ''}`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Layout() {
  const nav = useNavigate();
  const location = useLocation();
  const token = getToken();
  const theme = useTheme();
  const cardSize = useCardSize();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    let cancelled = false;
    apiRequest('/auth/me')
      .then((res) => {
        if (!cancelled) setUser(res.user || null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });

    return () => {
      cancelled = true;
    };
  }, [token, location.pathname]);

  function logout() {
    clearToken();
    setUser(null);
    nav('/app/login');
  }

  // Close the drawer when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    if (menuOpen) window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <div className="mx-auto w-full max-w-none p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Mobile drawer overlay */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[1200] bg-black/40 backdrop-blur-[1px]"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile left drawer */}
      <aside
        className={
          `fixed left-0 top-0 z-[1210] h-full w-[82vw] max-w-xs transform border-r border-slate-900/10 bg-white/90 p-4 shadow-2xl backdrop-blur transition-transform duration-200 dark:border-white/10 dark:bg-[#0b1220]/90 ` +
          (menuOpen ? 'translate-x-0' : '-translate-x-full')
        }
        aria-hidden={!menuOpen}
      >
        <div className="flex items-center justify-between gap-2">
          <Link to="/app/search" className="flex items-center gap-3" title="Home">
            <div className="h-9 w-9 rounded-2xl border border-slate-900/10 bg-white/60 dark:border-white/10 dark:bg-white/5" />
            <div>
              <div className="text-base font-extrabold tracking-tight">TCG Exchange</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Menu</div>
            </div>
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          <NavItem to="/app/search">Search</NavItem>
          <NavItem to="/app/collection">Collection</NavItem>
          <NavItem to="/app/wishlist">Wishlist</NavItem>
          <NavItem to="/app/trades">Trades</NavItem>
          <NavItem to="/app/profile">Profile</NavItem>
          {user?.role === 'admin' && <NavItem to="/app/admin">Admin</NavItem>}
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-slate-900/10 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Card size</div>
            <input
              className="h-2 w-full accent-sky-600 dark:accent-cyan-400"
              type="range"
              min={0}
              max={100}
              step={1}
              value={cardSize.scale}
              onChange={(e) => cardSize.setScale(Number(e.target.value))}
              aria-label="Card size"
            />
          </div>

          <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-900/10 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="font-semibold text-slate-700 dark:text-slate-200">Theme</div>
            <ThemeToggle theme={theme.theme} onToggle={theme.toggle} />
          </div>

          {token ? (
            <button
              className="btn btn-primary"
              type="button"
              onClick={logout}
            >
              Log out
            </button>
          ) : (
            <Link className="btn btn-primary" to="/app/login">Log in</Link>
          )}
        </div>
      </aside>

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>

            <Link to="/app/search" className="flex items-center gap-3" title="Home">
              <div className="h-10 w-10 rounded-2xl border border-slate-900/10 bg-white/60 dark:border-white/10 dark:bg-white/5" />
              <div>
                <div className="text-xl font-extrabold tracking-tight">TCG Exchange</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">React rewrite POC</div>
              </div>
            </Link>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {token ? (
            <Link
              className="rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-white/5"
              to="/app/profile"
              title="Profile"
            >
              {user?.username || 'Account'}
            </Link>
          ) : (
            <Link className="btn btn-primary" to="/app/login">Log in</Link>
          )}
        </div>
      </div>

      <Outlet />

      <div className="mt-10 text-center text-xs text-slate-500">
        Backend/API is unchanged. Vite proxies /auth, /cards, /collection, /wishlist, /trades.
      </div>
    </div>
  );
}
