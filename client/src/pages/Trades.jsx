import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import TradeBuilderModal from '../components/TradeBuilderModal';

function statusInfo(status) {
  const s = String(status || 'pending').toLowerCase();
  if (s === 'accepted') return { label: 'Accepted', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' };
  if (s === 'denied' || s === 'declined') return { label: 'Denied', cls: 'border-red-400/40 bg-red-400/10 text-red-300' };
  if (s === 'countered') return { label: 'Countered', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' };
  return { label: 'Pending', cls: 'border-sky-400/40 bg-sky-400/10 text-sky-300' };
}

function fmtDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

function fmt(card) {
  if (!card) return '';
  const set = card.setName ? ` — ${card.setName}` : '';
  const num = card.number ? ` #${card.number}` : '';
  return `${card.name || card.id}${set}${num}`;
}

export default function Trades() {
  const nav = useNavigate();
  const [trades, setTrades] = useState([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [tradesErr, setTradesErr] = useState('');
  const [showHiddenTrades, setShowHiddenTrades] = useState(false);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [matches, setMatches] = useState(null);
  const [selected, setSelected] = useState({});
  const [builder, setBuilder] = useState(null);
  const [builderInitialSelected, setBuilderInitialSelected] = useState({});

  async function loadTrades(hidden = showHiddenTrades) {
    setTradesLoading(true);
    setTradesErr('');
    try {
      const data = await apiRequest(`/trades${hidden ? '?hidden=true' : ''}`);
      setTrades(data.trades || []);
    } catch (e) {
      setTradesErr(e.message);
    } finally {
      setTradesLoading(false);
    }
  }

  async function unhideTrade(id) {
    await apiRequest(`/trades/${encodeURIComponent(id)}/hide`, {
      method: 'POST',
      body: { hidden: false }
    });
    await loadTrades(true);
  }

  async function loadRecs() {
    setLoading(true);
    setErr('');
    try {
      const data = await apiRequest('/trades/recommendations?limit=15');
      setRecs(data.recommendations || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function viewMatches(otherUserId) {
    const data = await apiRequest(`/trades/matches/${otherUserId}`);
    setMatches({ otherUserId, ...data });
    setSelected({});
  }

  async function openTradeBuilder() {
    if (!matches) return;
    const data = await apiRequest(`/trades/builder/${matches.otherUserId}`);
    setBuilderInitialSelected({});
    setBuilder(data);
  }

  async function sendTradeOffer({ message, items }) {
    const res = await apiRequest('/trades', {
      method: 'POST',
      body: { recipientId: matches.otherUserId, message, items }
    });

    const tradeId = res?.trade?.id || res?.id;
    setBuilder(null);
    if (tradeId) nav(`/app/trades/${encodeURIComponent(tradeId)}`);
    else alert('Trade proposed (no trade id returned)');
  }

  useEffect(() => {
    loadTrades(showHiddenTrades);
  }, [showHiddenTrades]);

  useEffect(() => {
    loadRecs();
  }, []);

  return (
    <div className="grid gap-4">
      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold">Trades</div>
              {trades.some((trade) => trade.needsResponse) && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {trades.filter((trade) => trade.needsResponse).length} needs action
                </span>
              )}
            </div>
            <div className="text-sm text-slate-400">Incoming, outgoing, and countered trade offers</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => setShowHiddenTrades((v) => !v)}
            >
              {showHiddenTrades ? 'Show active' : 'Show hidden'}
            </button>
            <button className="btn btn-primary" onClick={() => loadTrades()}>Refresh</button>
          </div>
        </div>

        {tradesLoading && <div className="mt-4 text-slate-400">Loading trades…</div>}
        {tradesErr && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm">{tradesErr}</div>}

        <div className="mt-4 grid gap-2">
          {!tradesLoading && !trades.length && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-400">
              {showHiddenTrades
                ? 'No hidden trades.'
                : 'No trades yet. Create an offer from a recommended match below.'}
            </div>
          )}
          {trades.map((trade) => {
            const info = statusInfo(trade.status);
            const active = trade.activeOffer;
            return (
              <button
                key={trade.id}
                type="button"
                className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 md:flex-row md:items-center md:justify-between"
                onClick={() => nav(`/app/trades/${encodeURIComponent(trade.id)}`)}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">Trade #{trade.id}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${info.cls}`}>{info.label}</span>
                    {trade.needsResponse && <span className="badge">Needs your response</span>}
                    {Number(trade.unreadCount) > 0 && (
                      <span className="rounded-full bg-neonCyan px-2 py-0.5 text-xs font-bold text-slate-950">
                        {trade.unreadCount} unread
                      </span>
                    )}
                    {trade.hiddenForViewer && <span className="badge">Hidden</span>}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    With {trade.otherUser?.username || 'trader'} · Offer v{active?.version || 1} · {active?.items?.length || 0} card line(s)
                  </div>
                  {active?.message && <div className="mt-1 line-clamp-1 text-sm text-slate-300">“{active.message}”</div>}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{fmtDate(trade.updatedAt)}</span>
                  {trade.hiddenForViewer && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="btn btn-ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        unhideTrade(trade.id).catch((error) => alert(error.message));
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        e.stopPropagation();
                        unhideTrade(trade.id).catch((error) => alert(error.message));
                      }}
                    >
                      Unhide
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold">Recommended traders</div>
            <div className="text-sm text-slate-400">Based on wishlist priority + availability</div>
          </div>
          <button className="btn btn-primary" onClick={loadRecs}>Refresh</button>
        </div>

        {loading && <div className="mt-4 text-slate-400">Loading…</div>}
        {err && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm">{err}</div>}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recs.map((r) => (
            <div key={r.user.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold">{r.user.username}</div>
                  <div className="text-sm text-slate-400">Score {r.score} · {r.swapCount} swap ideas</div>
                </div>
                <button className="btn btn-ghost" onClick={() => viewMatches(r.user.id)}>View</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="text-lg font-bold">Matches</div>
        {!matches && <div className="mt-2 text-sm text-slate-400">Pick a recommended user to see matches.</div>}

        {matches && (
          <div className="mt-3 grid gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-400">With <span className="text-slate-100 font-semibold">{matches.otherUser.username}</span></div>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => openTradeBuilder().catch((e) => alert(e.message))}
              >
                Create Trade Offer
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 font-semibold">You have cards they want</div>
                <div className="grid gap-2">
                  {(matches.iGive || []).slice(0, 8).map((m) => (
                    <div key={m.cardId} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                      {fmt(m.card)} <span className="text-slate-400">· up to {m.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 font-semibold">They have cards you want</div>
                <div className="grid gap-2">
                  {(matches.theyGive || []).slice(0, 8).map((m) => (
                    <div key={m.cardId} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                      {fmt(m.card)} <span className="text-slate-400">· up to {m.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 font-semibold">Suggested 1:1 swaps</div>
              <div className="grid gap-2">
                {(matches.suggestedSwaps || []).slice(0, 20).map((s) => {
                  const key = `${s.give.id}::${s.receive.id}`;
                  return (
                    <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                      <input
                        type="checkbox"
                        checked={!!selected[key]}
                        onChange={(e) => setSelected((prev) => ({ ...prev, [key]: e.target.checked }))}
                      />
                      <div className="text-sm">
                        <div className="font-semibold">Give: {fmt(s.give)}</div>
                        <div className="text-slate-400">Receive: {fmt(s.receive)} · x{s.quantity || 1}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

            </div>
          </div>
        )}
      </div>

      {builder && (
        <TradeBuilderModal
          builder={builder}
          initialSelected={builderInitialSelected}
          initialMessage=""
          onClose={() => setBuilder(null)}
          onSubmit={sendTradeOffer}
        />
      )}
    </div>
  );
}
