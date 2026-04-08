import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearToken, getToken } from './api';
import ThemeToggle from './components/ThemeToggle.jsx';
import { useTheme } from './theme';
import { useCardSize } from './cardSize.jsx';
import { useGridCols } from './gridCols.jsx';

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
  const gridCols = useGridCols();
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="mx-auto max-w-6xl p-3 sm:p-4 md:p-6">
      {/* Mobile drawer overlay */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile left drawer */}
      <aside
        className={
          `fixed left-0 top-0 z-50 h-full w-[82vw] max-w-xs transform border-r border-slate-900/10 bg-white/90 p-4 shadow-2xl backdrop-blur transition-transform duration-200 dark:border-white/10 dark:bg-[#0b1220]/90 ` +
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
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-slate-900/10 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Card size</div>
            <select
              className="input"
              value={cardSize.size}
              onChange={(e) => cardSize.setSize(e.target.value)}
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-900/10 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Grid columns</div>
            <select
              className="input"
              value={gridCols.maxCols}
              onChange={(e) => gridCols.setMaxCols(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-900/10 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="font-semibold text-slate-700 dark:text-slate-200">Theme</div>
            <ThemeToggle theme={theme.theme} onToggle={theme.toggle} />
          </div>

          {token ? (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                clearToken();
                nav('/app/login');
              }}
            >
              Log out
            </button>
          ) : (
            <Link className="btn btn-primary" to="/app/login">Log in</Link>
          )}
        </div>
      </aside>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Hamburger (mobile only) */}
            <button
              type="button"
              className="btn btn-ghost md:hidden"
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

        {/* Desktop nav */}
        <div className="hidden flex-wrap items-center gap-2 md:flex">
          <NavItem to="/app/search">Search</NavItem>
          <NavItem to="/app/collection">Collection</NavItem>
          <NavItem to="/app/wishlist">Wishlist</NavItem>
          <NavItem to="/app/trades">Trades</NavItem>
          <NavItem to="/app/profile">Profile</NavItem>

          <div className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="text-slate-700 dark:text-slate-200">Card size</div>
            <select
              className="rounded-lg border border-slate-900/10 bg-white/70 px-2 py-1 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              value={cardSize.size}
              onChange={(e) => cardSize.setSize(e.target.value)}
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="text-slate-700 dark:text-slate-200">Grid</div>
            <select
              className="rounded-lg border border-slate-900/10 bg-white/70 px-2 py-1 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              value={gridCols.maxCols}
              onChange={(e) => gridCols.setMaxCols(Number(e.target.value))}
              title="Max columns"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <ThemeToggle theme={theme.theme} onToggle={theme.toggle} />

          {token ? (
            <button
              className="btn btn-ghost"
              onClick={() => {
                clearToken();
                nav('/app/login');
              }}
            >
              Log out
            </button>
          ) : (
            <Link className="btn btn-ghost" to="/app/login">Log in</Link>
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
