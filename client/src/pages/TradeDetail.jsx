import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../api';
import TradeBuilderModal from '../components/TradeBuilderModal';

function statusInfo(status) {
  const s = String(status || 'pending').toLowerCase();
  if (s === 'accepted') return { label: 'Accepted', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' };
  if (s === 'denied' || s === 'declined') return { label: 'Denied', cls: 'border-red-400/40 bg-red-400/10 text-red-300' };
  if (s === 'countered') return { label: 'Countered', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' };
  return { label: 'Pending', cls: 'border-sky-400/40 bg-sky-400/10 text-sky-300' };
}

function fmtCard(item) {
  const card = item.card || {};
  const set = card.setName ? ` — ${card.setName}` : '';
  const num = card.number ? ` #${card.number}` : '';
  return `${card.name || item.cardId}${set}${num}`;
}

function ItemsByOwner({ offer, trade }) {
  const owners = useMemo(() => {
    const map = new Map([
      [trade.initiatorId, trade.initiator],
      [trade.recipientId, trade.recipient]
    ]);
    return map;
  }, [trade]);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {[trade.initiatorId, trade.recipientId].map((ownerId) => (
        <div key={ownerId} className="rounded-2xl border border-slate-900/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="font-bold">{owners.get(ownerId)?.username || 'Trader'} gives</div>
          <div className="mt-3 grid gap-2">
            {(offer.items || []).filter((item) => item.ownerId === ownerId).map((item) => (
              <div key={item.id} className="flex gap-3 rounded-xl border border-slate-900/10 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                {item.card?.imageSmall ? (
                  <img
                    src={item.card.imageSmall}
                    alt={item.card?.name || item.cardId}
                    className="h-16 w-11 rounded object-cover ring-1 ring-black/5 dark:ring-white/10"
                  />
                ) : null}
                <div>
                  <div className="font-semibold">{fmtCard(item)}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">x{item.quantity}</div>
                </div>
              </div>
            ))}
            {!offer.items?.some((item) => item.ownerId === ownerId) && (
              <div className="text-sm text-slate-600 dark:text-slate-400">No cards selected.</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TradeDetail() {
  const { id } = useParams();
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [builder, setBuilder] = useState(null);
  const [builderInitialSelected, setBuilderInitialSelected] = useState({});
  const [chatMessage, setChatMessage] = useState('');
  const [chatSending, setChatSending] = useState(false);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const res = await apiRequest(`/trades/${encodeURIComponent(id)}`);
      setTrade(res.trade || res);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function respond(action) {
    await apiRequest(`/trades/${encodeURIComponent(id)}/respond`, {
      method: 'POST',
      body: { action }
    });
    await load();
  }

  async function hide(hidden = true) {
    await apiRequest(`/trades/${encodeURIComponent(id)}/hide`, {
      method: 'POST',
      body: { hidden }
    });
    alert(hidden ? 'Trade hidden' : 'Trade unhidden');
    await load();
  }

  async function sendMessage() {
    const message = chatMessage.trim();
    if (!message) return;
    setChatSending(true);
    try {
      const res = await apiRequest(`/trades/${encodeURIComponent(id)}/messages`, {
        method: 'POST',
        body: { message }
      });
      setTrade(res.trade);
      setChatMessage('');
    } finally {
      setChatSending(false);
    }
  }

  async function openCounterBuilder() {
    const otherUserId = trade.viewerId === trade.initiatorId
      ? trade.recipientId
      : trade.initiatorId;
    const data = await apiRequest(`/trades/builder/${otherUserId}`);
    const initial = {};

    (trade.activeOffer?.items || []).forEach((item) => {
      if (!item.collectionItemId) return;
      initial[item.collectionItemId] = {
        collectionItemId: item.collectionItemId,
        ownerId: item.ownerId,
        cardId: item.cardId,
        quantity: item.quantity || 1
      };
    });

    setBuilderInitialSelected(initial);
    setBuilder(data);
  }

  async function sendCounter({ message, items }) {
    const res = await apiRequest(`/trades/${encodeURIComponent(id)}/counter`, {
      method: 'POST',
      body: { message, items }
    });
    setTrade(res.trade);
    setBuilder(null);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const activeOffer = trade?.activeOffer;
  const status = statusInfo(trade?.status);

  return (
    <div className="grid gap-4">
      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-bold">Trade detail</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Trade ID: {id}</div>
          </div>
          <div className="flex gap-2">
            <Link className="btn btn-ghost" to="/app/trades">Back</Link>
            <button className="btn btn-primary" onClick={load} disabled={loading}>Refresh</button>
          </div>
        </div>

        {loading && <div className="mt-4 text-slate-600 dark:text-slate-400">Loading…</div>}
        {err && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm">{err}</div>}

        {trade && activeOffer && (
          <div className="mt-4 grid gap-4">
            <div className="rounded-2xl border border-slate-900/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="font-bold">Current offer v{activeOffer.version}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Status: <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${status.cls}`}>{status.label}</span> · Offered by {activeOffer.proposer?.username || 'trader'}
                  </div>
                  {activeOffer.message && <div className="mt-3 rounded-xl bg-black/5 p-3 text-sm dark:bg-white/5">{activeOffer.message}</div>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-primary" onClick={() => respond('accept').catch((e) => alert(e.message))}>Accept</button>
                  <button className="btn btn-ghost" onClick={() => respond('decline').catch((e) => alert(e.message))}>Deny</button>
                  <button className="btn btn-primary" onClick={() => openCounterBuilder().catch((e) => alert(e.message))}>Counter offer</button>
                  <button className="btn btn-ghost" onClick={() => hide(true).catch((e) => alert(e.message))}>Hide</button>
                </div>
              </div>
            </div>

            <ItemsByOwner offer={activeOffer} trade={trade} />

            <div className="rounded-2xl border border-slate-900/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="font-bold">Trade chat</div>
              <div className="mt-3 grid max-h-80 gap-2 overflow-auto pr-1">
                {(trade.messages || []).map((message) => {
                  const mine = message.senderId === trade.viewerId;
                  return (
                    <div
                      key={message.id}
                      className={`rounded-xl border p-3 text-sm ${mine ? 'ml-auto border-neonCyan/30 bg-neonCyan/10' : 'mr-auto border-slate-900/10 bg-white/70 dark:border-white/10 dark:bg-white/5'}`}
                    >
                      <div className="text-xs font-semibold text-slate-500">
                        {message.sender?.username || 'Trader'} · {new Date(message.createdAt).toLocaleString()}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap">{message.message}</div>
                    </div>
                  );
                })}
                {!(trade.messages || []).length && (
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    No chat messages yet. This stays open even after a trade is accepted or denied.
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="input"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' || e.shiftKey) return;
                    e.preventDefault();
                    sendMessage().catch((error) => alert(error.message));
                  }}
                  placeholder="Write a message about this trade…"
                />
                <button
                  className="btn btn-primary"
                  onClick={() => sendMessage().catch((e) => alert(e.message))}
                  disabled={chatSending || !chatMessage.trim()}
                >
                  Send
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-900/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="font-bold">Offer history</div>
              <div className="mt-3 grid gap-2">
                {(trade.offers || []).map((offer) => (
                  <div key={offer.id} className="rounded-xl border border-slate-900/10 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                    <div className="font-semibold">v{offer.version} · {offer.proposer?.username || 'trader'}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{offer.items?.length || 0} card lines</div>
                    {offer.message && <div className="mt-1">{offer.message}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {builder && (
        <TradeBuilderModal
          title="Counter Trade Offer"
          builder={builder}
          initialSelected={builderInitialSelected}
          initialMessage=""
          sendLabel="Send counter offer"
          onClose={() => setBuilder(null)}
          onSubmit={sendCounter}
        />
      )}
    </div>
  );
}
