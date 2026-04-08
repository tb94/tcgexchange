import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api';
import { useCardsByIds } from '../hooks/useCardsByIds';

function ItemRow({ item, card, onUpdate, onDelete, selectMode, selected, onToggleSelected, onEdit }) {
  const [qty, setQty] = useState(item.quantity);
  const [condition, setCondition] = useState(item.condition);
  const [notes, setNotes] = useState(item.notes || '');
  const [showNote, setShowNote] = useState(false);
  const hasNote = Boolean(item.notes && String(item.notes).trim());

  useEffect(() => {
    setQty(item.quantity);
    setCondition(item.condition);
    setNotes(item.notes || '');
    setShowNote(false);
  }, [item.condition, item.quantity, item.notes]);

  return (
    <div
      className={
        `relative flex flex-col gap-3 rounded-2xl border bg-white/70 p-3 dark:bg-white/5 md:flex-row md:items-center md:justify-between ` +
        (selected ? 'border-neonCyan/60 ring-4 ring-neonCyan/10' : 'border-slate-900/10 dark:border-white/10')
      }
      onClick={() => {
        if (!selectMode) return;
        onToggleSelected(item.id);
      }}
      role={selectMode ? 'button' : undefined}
      tabIndex={selectMode ? 0 : undefined}
      onKeyDown={(e) => {
        if (!selectMode) return;
        if (e.key === 'Enter' || e.key === ' ') onToggleSelected(item.id);
      }}
    >
      {!selectMode && (
        <button
          type="button"
          className="btn btn-ghost absolute right-2 top-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(item);
          }}
        >
          Edit
        </button>
      )}
      {selectMode && (
        <label
          className="absolute left-2 top-2 z-10 flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/80 px-2 py-1 text-xs font-semibold shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#0b1220]/80"
          onClick={(e) => e.stopPropagation()}
        >
          <input type="checkbox" checked={selected} onChange={() => onToggleSelected(item.id)} />
          Select
        </label>
      )}
      <div className="flex min-w-0 items-center gap-3">
        {card?.images?.small ? (
          <img
            src={card.images.small}
            alt={card.name}
            style={{ height: 'calc(var(--card-thumb-h) * 0.85)', width: 'calc(var(--card-thumb-w) * 0.85)' }}
            className="rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
            loading="lazy"
          />
        ) : (
          <div style={{ height: 'calc(var(--card-thumb-h) * 0.85)', width: 'calc(var(--card-thumb-w) * 0.85)' }} className="rounded-lg bg-black/5 dark:bg-white/5" />
        )}

        <div className="min-w-0">
          <div className="truncate font-bold">{card?.name || item.cardId}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {card?.set ? `${card.set} ` : ''}{card?.number ? `#${card.number}` : ''}
          </div>
          <div className="mt-1 text-xs text-slate-500">Card ID: {item.cardId}</div>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-4 md:items-end">
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Condition</label>
          <select className="input mt-1" value={condition} onChange={(e) => setCondition(e.target.value)}>
            {['NM', 'LP', 'MP', 'HP', 'DMG'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Qty</label>
          <input className="input mt-1" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Notes</label>
          <input className="input mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      {hasNote && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn btn-ghost" onClick={() => setShowNote((v) => !v)}>
            {showNote ? 'Hide note' : 'Show note'}
          </button>
          {showNote && (
            <div className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-900/10 bg-white/60 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              {String(item.notes).trim()}
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-primary" type="button" onClick={() => onUpdate({ id: item.id, quantity: Number(qty), condition, notes }).catch((e) => alert(e.message))}>
          Save
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => onDelete(item.id).catch((e) => alert(e.message))}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default function Collection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [editItem, setEditItem] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editErr, setEditErr] = useState('');

  const CHUNK = 25;
  const [visibleCount, setVisibleCount] = useState(CHUNK);
  const sentinelRef = useRef(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkErr, setBulkErr] = useState('');
  const [bulkRows, setBulkRows] = useState([]);

  const [newCardId, setNewCardId] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newCondition, setNewCondition] = useState('NM');
  const [newNotes, setNewNotes] = useState('');

  const cardIds = useMemo(() => items.map((i) => i.cardId), [items]);
  const { cardsById } = useCardsByIds(cardIds);

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedCount = selectedIds.size;

  // Reset chunking + selection when list changes
  useEffect(() => {
    setVisibleCount(CHUNK);
    setSelectMode(false);
    setSelectedIds(new Set());
  }, [items.length]);

  // Infinite scroll sentinel for client-side chunking
  useEffect(() => {
    if (!sentinelRef.current) return undefined;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) return;
        setVisibleCount((v) => Math.min(items.length, v + CHUNK));
      },
      { root: null, rootMargin: '400px 0px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [items.length]);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const res = await apiRequest('/collection');
      setItems(res.items || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function add() {
    await apiRequest('/collection', {
      method: 'POST',
      body: {
        cardId: newCardId.trim(),
        quantity: Number(newQty),
        condition: newCondition,
        notes: newNotes || null
      },
    });
    setNewCardId('');
    setNewQty(1);
    setNewNotes('');
    await load();
  }

  async function update(payload) {
    await apiRequest(`/collection/${payload.id}`, { method: 'PUT', body: payload });
    await load();
  }

  async function remove(id) {
    if (!confirm('Delete this item?')) return;
    await apiRequest(`/collection/${id}`, { method: 'DELETE' });
    await load();
  }

  function openBulkEdit() {
    const ids = Array.from(selectedIds);
    const rows = items
      .filter((it) => ids.includes(it.id))
      .map((it) => ({
        id: it.id,
        cardId: it.cardId,
        quantity: it.quantity,
        condition: it.condition,
        notes: it.notes || ''
      }));

    setBulkRows(rows);
    setBulkErr('');
    setBulkOpen(true);
  }

  function closeBulk() {
    setBulkOpen(false);
    setBulkErr('');
    setBulkLoading(false);
    setBulkRows([]);
  }

  async function confirmBulkSave() {
    setBulkErr('');
    setBulkLoading(true);
    try {
      // eslint-disable-next-line no-restricted-syntax
      for (const row of bulkRows) {
        // eslint-disable-next-line no-await-in-loop
        await apiRequest(`/collection/${row.id}`, {
          method: 'PUT',
          body: { id: row.id, quantity: Number(row.quantity), condition: row.condition, notes: row.notes || null }
        });
      }
      closeBulk();
      await load();
      setSelectMode(false);
      setSelectedIds(new Set());
    } catch (e) {
      setBulkErr(e.message);
    } finally {
      setBulkLoading(false);
    }
  }

  async function confirmBulkDelete() {
    if (!confirm(`Delete ${selectedCount} item(s) from your collection?`)) return;
    setBulkErr('');
    setBulkLoading(true);
    try {
      // eslint-disable-next-line no-restricted-syntax
      for (const id of selectedIds) {
        // eslint-disable-next-line no-await-in-loop
        await apiRequest(`/collection/${id}`, { method: 'DELETE' });
      }
      await load();
      setSelectMode(false);
      setSelectedIds(new Set());
    } catch (e) {
      setBulkErr(e.message);
    } finally {
      setBulkLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid gap-4">
      <div className="card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-bold">Your collection</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Uses <span className="font-mono">/collection</span></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setSelectMode((v) => !v);
                setSelectedIds(new Set());
              }}
            >
              {selectMode ? 'Exit select' : 'Select'}
            </button>
            <Link className="btn btn-ghost" to="/app/search">Find cards</Link>
            <button className="btn btn-primary" type="button" onClick={load} disabled={loading}>Refresh</button>
          </div>
        </div>

        {selectMode && selectedCount > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-900/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="font-semibold">{selectedCount} selected</div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary" type="button" onClick={openBulkEdit}>Edit selected</button>
                <button className="btn btn-ghost" type="button" onClick={() => confirmBulkDelete().catch(() => {})} disabled={bulkLoading}>Delete selected</button>
                <button className="btn btn-ghost" type="button" onClick={() => setSelectedIds(new Set())}>Clear</button>
              </div>
            </div>
          </div>
        )}

        {err && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm">{err}</div>}

        <div className="mt-4 rounded-2xl border border-slate-900/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="font-bold">Add item</div>
          <div className="mt-2 grid gap-2 md:grid-cols-6">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Card ID</label>
              <input className="input mt-1" value={newCardId} onChange={(e) => setNewCardId(e.target.value)} placeholder="sv3pt5-65" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Condition</label>
              <select className="input mt-1" value={newCondition} onChange={(e) => setNewCondition(e.target.value)}>
                {['NM', 'LP', 'MP', 'HP', 'DMG'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Qty</label>
              <input className="input mt-1" type="number" min="1" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
            </div>
            <div className="md:col-span-6">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Notes</label>
              <input className="input mt-1" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <button className="btn btn-primary mt-3" onClick={() => add().catch((e) => alert(e.message))} disabled={!newCardId.trim()}>
            Add
          </button>
        </div>
      </div>

      {loading && <div className="card text-slate-600 dark:text-slate-400">Loading…</div>}

      <div className="grid gap-3">
        {items.slice(0, visibleCount).map((it) => (
          <ItemRow
            key={it.id}
            item={it}
            card={cardsById[it.cardId]}
            onUpdate={update}
            onDelete={remove}
            selectMode={selectMode}
            selected={selectedIds.has(it.id)}
            onToggleSelected={toggleSelected}
            onEdit={(item) => {
              setEditErr('');
              setEditItem({
                id: item.id,
                cardId: item.cardId,
                quantity: item.quantity,
                condition: item.condition,
                notes: item.notes || ''
              });
            }}
          />
        ))}
      </div>

      <div ref={sentinelRef} />

      {!loading && !items.length && (
        <div className="card text-sm text-slate-600 dark:text-slate-400">Your collection is empty.</div>
      )}

      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (editLoading) return;
              setEditItem(null);
              setEditErr('');
            }}
          />

          <div className="relative w-full max-w-xl rounded-2xl border border-slate-900/10 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#0b1220]/95">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold">Edit collection item</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{editItem.cardId}</div>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  if (editLoading) return;
                  setEditItem(null);
                  setEditErr('');
                }}
              >
                Close
              </button>
            </div>

            {editErr && (
              <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm">{editErr}</div>
            )}

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Condition</label>
                <select
                  className="input mt-1"
                  value={editItem.condition}
                  onChange={(e) => setEditItem((prev) => ({ ...prev, condition: e.target.value }))}
                >
                  {['NM', 'LP', 'MP', 'HP', 'DMG'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Qty</label>
                <input
                  className="input mt-1"
                  type="number"
                  min="1"
                  value={editItem.quantity}
                  onChange={(e) => setEditItem((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Notes</label>
                <input
                  className="input mt-1"
                  value={editItem.notes}
                  onChange={(e) => setEditItem((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  if (editLoading) return;
                  setEditItem(null);
                  setEditErr('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={editLoading}
                onClick={async () => {
                  setEditErr('');
                  setEditLoading(true);
                  try {
                    await update({
                      id: editItem.id,
                      quantity: Number(editItem.quantity),
                      condition: editItem.condition,
                      notes: editItem.notes || null
                    });
                    setEditItem(null);
                  } catch (e) {
                    setEditErr(e.message);
                  } finally {
                    setEditLoading(false);
                  }
                }}
              >
                {editLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={closeBulk} />
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl border border-slate-900/10 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#0b1220]/95">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold">Edit collection items</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Edit {bulkRows.length} selected item(s), then confirm.</div>
              </div>
              <button type="button" className="btn btn-ghost" onClick={closeBulk}>Close</button>
            </div>

            {bulkErr && (
              <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm">{bulkErr}</div>
            )}

            <div className="mt-4 grid gap-3">
              {bulkRows.map((row, idx) => {
                const card = cardsById[row.cardId];
                return (
                  <div key={row.id} className="rounded-2xl border border-slate-900/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {card?.images?.small ? (
                          <img
                            src={card.images.small}
                            alt={card?.name || row.cardId}
                            style={{ height: 'calc(var(--card-thumb-h) * 0.95)', width: 'calc(var(--card-thumb-w) * 0.95)' }}
                            className="rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
                          />
                        ) : (
                          <div style={{ height: 'calc(var(--card-thumb-h) * 0.95)', width: 'calc(var(--card-thumb-w) * 0.95)' }} className="rounded-lg bg-black/5 dark:bg-white/5" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-bold">{card?.name || row.cardId}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {card?.set ? `${card.set} ` : ''}{card?.number ? `#${card.number}` : ''}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">Item #{row.id}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setBulkRows((prev) => prev.filter((x) => x.id !== row.id));
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            next.delete(row.id);
                            return next;
                          });
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Condition</label>
                        <select
                          className="input mt-1"
                          value={row.condition}
                          onChange={(e) => {
                            const v = e.target.value;
                            setBulkRows((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], condition: v };
                              return next;
                            });
                          }}
                        >
                          {['NM', 'LP', 'MP', 'HP', 'DMG'].map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Quantity</label>
                        <input
                          className="input mt-1"
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => {
                            const v = e.target.value;
                            setBulkRows((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], quantity: v };
                              return next;
                            });
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Notes</label>
                        <input
                          className="input mt-1"
                          value={row.notes}
                          onChange={(e) => {
                            const v = e.target.value;
                            setBulkRows((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], notes: v };
                              return next;
                            });
                          }}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={closeBulk} disabled={bulkLoading}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => confirmBulkSave().catch(() => {})}
                disabled={bulkLoading || bulkRows.length === 0}
              >
                {bulkLoading ? 'Saving…' : 'Confirm save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
