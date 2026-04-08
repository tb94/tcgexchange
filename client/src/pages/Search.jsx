import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api';
import { useCardSize } from '../cardSize.jsx';
import { useGridCols } from '../gridCols.jsx';
import { useAutoGridCols } from '../hooks/useAutoGridCols';

function uniq(arr) {
  return Array.from(new Set(arr));
}

function CardTile({ card, selectMode, selected, onToggleSelected }) {
  return (
    <div className="relative">
      {selectMode && (
        <label
          className="absolute left-2 top-2 z-10 flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/80 px-2 py-1 text-xs font-semibold shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#0b1220]/80"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelected(card.id)}
          />
          Select
        </label>
      )}

      <Link
        to={`/app/cards/${encodeURIComponent(card.id)}`}
        className={
          `group block rounded-2xl border bg-white/70 p-3 hover:shadow-md dark:bg-white/5 ` +
          (selected ? 'border-neonCyan/60 ring-4 ring-neonCyan/10' : 'border-slate-900/10 dark:border-white/10')
        }
        onClick={(e) => {
          if (!selectMode) return;
          // In select mode, clicking the tile toggles selection instead of navigating.
          e.preventDefault();
          onToggleSelected(card.id);
        }}
      >
        <div className="flex gap-3">
          <img
            src={card.images?.small}
            alt={card.name}
            style={{ height: 'var(--card-thumb-h)', width: 'var(--card-thumb-w)' }}
            className="rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
            loading="lazy"
          />
          <div className="min-w-0">
            <div className="truncate font-bold group-hover:underline">{card.name}</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {card.set?.name}{card.number ? ` #${card.number}` : ''}
            </div>
            {card.rarity && <div className="mt-1"><span className="badge">{card.rarity}</span></div>}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Search() {
  const [sets, setSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(true);

  const [nameInput, setNameInput] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [setId, setSetId] = useState('');
  const [rarity, setRarity] = useState('');
  const [supertype, setSupertype] = useState('');
  const [type, setType] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(24);

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [err, setErr] = useState('');

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const [bulkAction, setBulkAction] = useState(null); // 'collection' | 'wishlist' | null
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkErr, setBulkErr] = useState('');
  const [bulkRows, setBulkRows] = useState([]);

  const sentinelRef = useRef(null);
  const gridContainerRef = useRef(null);
  const cardSize = useCardSize();
  const gridPrefs = useGridCols();
  const cols = useAutoGridCols({
    // Measure the *container* width so overflow doesn't trick the calculation.
    containerRef: gridContainerRef,
    maxCols: gridPrefs.maxCols,
    minTilePx: cardSize.minTilePx,
    gapPx: 12
  });

  // Debounce name input to avoid hammering the API while typing.
  useEffect(() => {
    const t = setTimeout(() => {
      setNameQuery(nameInput.trim());
    }, 800);
    return () => clearTimeout(t);
  }, [nameInput]);

  const filters = useMemo(() => {
    const f = {};
    if (nameQuery) f.name = nameQuery;
    if (setId) f.sets = [setId];
    if (rarity) f.rarities = [rarity];
    if (supertype) f.supertypes = [supertype];
    if (type) f.types = [type];
    return f;
  }, [nameQuery, rarity, setId, supertype, type]);

  async function loadSets() {
    setLoadingSets(true);
    try {
      const res = await apiRequest('/cards/sets_local');
      setSets(res.sets || []);
    } finally {
      setLoadingSets(false);
    }
  }

  async function search(goToPage = 1, { append = false } = {}) {
    if (append) setLoadingMore(true);
    else setLoading(true);

    setErr('');
    try {
      const res = await apiRequest('/cards/search_local', {
        method: 'POST',
        body: {
          filters,
          sort: 'name',
          page: goToPage,
          pageSize,
        },
      });

      const next = res.cards || [];
      setCards((prev) => (append ? [...prev, ...next] : next));
      setPage(goToPage);
      setHasMore(next.length >= pageSize);
    } catch (e) {
      setErr(e.message);
      setHasMore(false);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }

  useEffect(() => {
    loadSets().catch(() => {});
    // initial search
    search(1, { append: false }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When filters change, reset and fetch page 1.
  useEffect(() => {
    // Reset results
    setCards([]);
    setPage(1);
    setHasMore(true);

    // Reset selection when filters change (avoid "invisible" checked cards).
    setSelectMode(false);
    setSelectedIds(new Set());

    search(1, { append: false }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedCount = selectedIds.size;

  async function openBulk(which) {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    setBulkAction(which);
    setBulkErr('');
    setBulkLoading(true);
    try {
      // Prefer local card cache; external fallback only for misses.
      const res = await apiRequest('/cards/bulk', { method: 'POST', body: { ids } });
      const map = res.cards || {};

      const rows = ids.map((id) => {
        const c = map[id];
        return {
          id,
          name: c?.name,
          images: c?.images,
          set: c?.set,
          number: c?.number,
          // defaults
          qty: 1,
          condition: 'NM',
          minCondition: 'NM',
          priority: 3,
          notes: ''
        };
      });

      setBulkRows(rows);
    } catch (e) {
      setBulkErr(e.message);
      setBulkRows([]);
    } finally {
      setBulkLoading(false);
    }
  }

  function closeBulk() {
    setBulkAction(null);
    setBulkErr('');
    setBulkLoading(false);
    setBulkRows([]);
  }

  async function confirmBulk() {
    if (!bulkAction) return;
    setBulkErr('');
    setBulkLoading(true);

    try {
      // Do sequential requests to avoid spiking the backend.
      // eslint-disable-next-line no-restricted-syntax
      for (const row of bulkRows) {
        if (bulkAction === 'collection') {
          // eslint-disable-next-line no-await-in-loop
          await apiRequest('/collection', {
            method: 'POST',
            body: { cardId: row.id, condition: row.condition, quantity: Number(row.qty) }
          });
        } else {
          // wishlist
          // eslint-disable-next-line no-await-in-loop
          await apiRequest('/wishlist', {
            method: 'POST',
            body: {
              cardId: row.id,
              minCondition: row.minCondition,
              quantityDesired: Number(row.qty),
              priority: Number(row.priority),
              notes: row.notes || null
            }
          });
        }
      }

      // clear selection after success
      setSelectedIds(new Set());
      setSelectMode(false);
      closeBulk();
      alert(`Added ${bulkRows.length} card(s) to ${bulkAction}.`);
    } catch (e) {
      setBulkErr(e.message);
    } finally {
      setBulkLoading(false);
    }
  }

  // Infinite scroll: when sentinel enters view, load next page.
  useEffect(() => {
    if (!sentinelRef.current) return undefined;

    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) return;
        if (loading || loadingMore) return;
        if (!hasMore) return;
        if (err) return;
        search(page + 1, { append: true }).catch(() => {});
      },
      { root: null, rootMargin: '400px 0px', threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [err, hasMore, loading, loadingMore, page]);

  return (
    <div className="grid gap-4">
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          if (loading) return;
          // Force immediate search using the current input (no debounce delay)
          const next = nameInput.trim();
          setNameQuery(next);
          search(1, { append: false }).catch(() => {});
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-lg font-bold">Search cards (local)</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Uses <span className="font-mono">/cards/search_local</span> + <span className="font-mono">/cards/sets_local</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setSelectMode((v) => !v);
                setSelectedIds(new Set());
              }}
              title="Select multiple cards"
            >
              {selectMode ? 'Exit select' : 'Select'}
            </button>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>

        {err && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm">{err}</div>}

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Name</label>
            <input className="input mt-1" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Pikachu" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Set</label>
            <select className="input mt-1" value={setId} onChange={(e) => setSetId(e.target.value)} disabled={loadingSets}>
              <option value="">Any</option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Rarity</label>
            <select className="input mt-1" value={rarity} onChange={(e) => setRarity(e.target.value)}>
              <option value="">Any</option>
              <option>Common</option>
              <option>Uncommon</option>
              <option>Rare</option>
              <option>Rare Holo</option>
              <option>Double Rare</option>
              <option>Illustration Rare</option>
              <option>Special Illustration Rare</option>
              <option>Hyper Rare</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Supertype</label>
            <select className="input mt-1" value={supertype} onChange={(e) => setSupertype(e.target.value)}>
              <option value="">Any</option>
              <option>Pokémon</option>
              <option>Trainer</option>
              <option>Energy</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Type</label>
            <select className="input mt-1" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Any</option>
              {['Colorless', 'Darkness', 'Dragon', 'Fairy', 'Fighting', 'Fire', 'Grass', 'Lightning', 'Metal', 'Psychic', 'Water'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setNameInput('');
              setNameQuery('');
              setSetId('');
              setRarity('');
              setSupertype('');
              setType('');
            }}
          >
            Clear
          </button>

          <div className="text-slate-600 dark:text-slate-400">
            {cards.length ? `${cards.length} loaded` : ''}
          </div>
        </div>
      </form>

      {selectMode && selectedCount > 0 && (
        <div className="card flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="font-semibold">{selectedCount} selected</div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" type="button" onClick={() => openBulk('collection')}>Add to collection</button>
            <button className="btn btn-primary" type="button" onClick={() => openBulk('wishlist')}>Add to wishlist</button>
            <button className="btn btn-ghost" type="button" onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        </div>
      )}

      <div ref={gridContainerRef} className="w-full">
        <div
          className="card-grid"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(${cardSize.minTilePx}px, 1fr))` }}
        >
          {cards.map((c) => (
            <CardTile
              key={c.id}
              card={c}
              selectMode={selectMode}
              selected={selectedIds.has(c.id)}
              onToggleSelected={toggleSelected}
            />
          ))}
        </div>
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} />

      {bulkAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40"
            onClick={closeBulk}
          />

          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl border border-slate-900/10 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#0b1220]/95">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold">
                  {bulkAction === 'collection' ? 'Add to collection' : 'Add to wishlist'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Review {bulkRows.length} selected card(s) before confirming.
                </div>
              </div>
              <button type="button" className="btn btn-ghost" onClick={closeBulk}>Close</button>
            </div>

            {bulkErr && (
              <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm">{bulkErr}</div>
            )}

            {bulkLoading && (
              <div className="mt-4 card text-sm text-slate-600 dark:text-slate-400">Working…</div>
            )}

            <div className="mt-4 grid gap-3">
              {bulkRows.map((row, idx) => (
                <div key={row.id} className="rounded-2xl border border-slate-900/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {row.images?.small ? (
                        <img
                          src={row.images.small}
                          alt={row.name || row.id}
                          style={{ height: 'calc(var(--card-thumb-h) * 0.95)', width: 'calc(var(--card-thumb-w) * 0.95)' }}
                          className="rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
                        />
                      ) : (
                        <div style={{ height: 'calc(var(--card-thumb-h) * 0.95)', width: 'calc(var(--card-thumb-w) * 0.95)' }} className="rounded-lg bg-black/5 dark:bg-white/5" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-bold">{row.name || row.id}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {row.set ? `${row.set} ` : ''}{row.number ? `#${row.number}` : ''}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{row.id}</div>
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

                  {bulkAction === 'collection' ? (
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
                          value={row.qty}
                          onChange={(e) => {
                            const v = e.target.value;
                            setBulkRows((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], qty: v };
                              return next;
                            });
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Min condition</label>
                        <select
                          className="input mt-1"
                          value={row.minCondition}
                          onChange={(e) => {
                            const v = e.target.value;
                            setBulkRows((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], minCondition: v };
                              return next;
                            });
                          }}
                        >
                          {['NM', 'LP', 'MP', 'HP', 'DMG'].map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Quantity desired</label>
                        <input
                          className="input mt-1"
                          type="number"
                          min="1"
                          value={row.qty}
                          onChange={(e) => {
                            const v = e.target.value;
                            setBulkRows((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], qty: v };
                              return next;
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Priority (1..5)</label>
                        <input
                          className="input mt-1"
                          type="number"
                          min="1"
                          max="5"
                          value={row.priority}
                          onChange={(e) => {
                            const v = e.target.value;
                            setBulkRows((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], priority: v };
                              return next;
                            });
                          }}
                        />
                      </div>
                      <div>
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
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={closeBulk} disabled={bulkLoading}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => confirmBulk().catch(() => {})}
                disabled={bulkLoading || bulkRows.length === 0}
              >
                Confirm add
              </button>
            </div>
          </div>
        </div>
      )}

      {(loadingMore || loading) && (
        <div className="card text-sm text-slate-600 dark:text-slate-400">Loading…</div>
      )}

      {!loading && !loadingMore && !cards.length && (
        <div className="card text-sm text-slate-600 dark:text-slate-400">No results.</div>
      )}

      {!loading && !loadingMore && cards.length > 0 && !hasMore && (
        <div className="card text-sm text-slate-600 dark:text-slate-400">End of results.</div>
      )}
    </div>
  );
}
