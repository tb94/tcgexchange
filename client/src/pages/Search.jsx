import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api';
import { useCardSize } from '../cardSize.jsx';
import { useGridCols } from '../gridCols.jsx';
import { useAutoGridCols } from '../hooks/useAutoGridCols';

function uniq(arr) {
  return Array.from(new Set(arr));
}

const RARITY_OPTIONS = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Double Rare', 'Illustration Rare', 'Special Illustration Rare', 'Hyper Rare'];
const SUPERTYPE_OPTIONS = ['Pokémon', 'Trainer', 'Energy'];
const TYPE_OPTIONS = ['Colorless', 'Darkness', 'Dragon', 'Fairy', 'Fighting', 'Fire', 'Grass', 'Lightning', 'Metal', 'Psychic', 'Water'];

function csvParam(searchParams, key) {
  return (searchParams.get(key) || '').split(',').map((v) => v.trim()).filter(Boolean);
}

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

function MultiSelectDropdown({ id, title, options, selected, onChange, openDropdownId, setOpenDropdownId }) {
  const normalized = options.map((option) => {
    if (typeof option === 'string') return { value: option, label: option };
    return { value: option.value, label: option.label || option.value };
  });
  const values = normalized.map((option) => option.value);
  const allSelected = values.length > 0 && selected.length === values.length;
  const isOpen = openDropdownId === id;

  return (
    <div className="relative z-[340]">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        onClick={() => setOpenDropdownId(isOpen ? null : id)}
        aria-expanded={isOpen}
      >
        <span className="font-semibold">{title}</span>
        <span className="text-xs text-slate-500">{selected.length ? `${selected.length} selected` : 'Any'}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[360] mt-1 w-full min-w-52 rounded-xl border border-slate-900/10 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#0b1220]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">{title}</div>
            <button
              className="text-xs font-semibold text-sky-700 dark:text-cyan-300"
              type="button"
              onClick={() => onChange(allSelected ? [] : values)}
            >
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <div className="grid max-h-56 gap-2 overflow-auto pr-1">
            {normalized.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => onChange(toggleValue(selected, option.value))}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
        state={{ from: `${location.pathname}${location.search}` }}
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
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sets, setSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(true);

  const initialName = searchParams.get('name') || '';
  const initialSetIds = csvParam(searchParams, 'set');
  const initialRarities = csvParam(searchParams, 'rarity');
  const initialSupertypes = csvParam(searchParams, 'supertype');
  const initialTypes = csvParam(searchParams, 'type');

  const [nameInput, setNameInput] = useState(initialName);
  const [nameQuery, setNameQuery] = useState(initialName);
  const [setIds, setSetIds] = useState(initialSetIds);
  const [rarities, setRarities] = useState(initialRarities);
  const [supertypes, setSupertypes] = useState(initialSupertypes);
  const [types, setTypes] = useState(initialTypes);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

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
    gapPx: 12,
    safetyPx: 20
  });

  // If URL search params change (back/forward navigation), hydrate UI state.
  useEffect(() => {
    const n = searchParams.get('name') || '';
    const nextSets = csvParam(searchParams, 'set');
    const nextRarities = csvParam(searchParams, 'rarity');
    const nextSupertypes = csvParam(searchParams, 'supertype');
    const nextTypes = csvParam(searchParams, 'type');

    setNameInput(n);
    setNameQuery(n);
    setSetIds(nextSets);
    setRarities(nextRarities);
    setSupertypes(nextSupertypes);
    setTypes(nextTypes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // Debounce name input to avoid hammering the API while typing.
  useEffect(() => {
    const t = setTimeout(() => {
      setNameQuery(nameInput.trim());
    }, 800);
    return () => clearTimeout(t);
  }, [nameInput]);

  // Persist current filters into the URL so leaving CardDetail and coming back keeps your search.
  useEffect(() => {
    const next = {};
    if (nameQuery) next.name = nameQuery;
    if (setIds.length) next.set = setIds.join(',');
    if (rarities.length) next.rarity = rarities.join(',');
    if (supertypes.length) next.supertype = supertypes.join(',');
    if (types.length) next.type = types.join(',');
    setSearchParams(next, { replace: true });
  }, [nameQuery, rarities, setIds, setSearchParams, supertypes, types]);

  const filters = useMemo(() => {
    const f = {};
    if (nameQuery) f.name = nameQuery;
    if (setIds.length) f.sets = setIds;
    if (rarities.length) f.rarities = rarities;
    if (supertypes.length) f.supertypes = supertypes;
    if (types.length) f.types = types;
    return f;
  }, [nameQuery, rarities, setIds, supertypes, types]);

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
  const activeFilterCount = (nameQuery ? 1 : 0) + setIds.length + rarities.length + supertypes.length + types.length;

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
        className="card relative z-[300]"
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

        <div className="mt-4 rounded-2xl border border-slate-900/10 bg-white/50 dark:border-white/10 dark:bg-white/5">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            onClick={() => {
              setFiltersOpen((v) => {
                const next = !v;
                if (!next) setOpenDropdownId(null);
                return next;
              });
            }}
            aria-expanded={filtersOpen}
          >
            <div>
              <div className="font-semibold">Filters</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {activeFilterCount ? `${activeFilterCount} active` : 'Name, set, rarity, supertype, and type'}
              </div>
            </div>
            <span className="text-xl leading-none">{filtersOpen ? '−' : '+'}</span>
          </button>

          {filtersOpen && (
            <div className="relative z-[320] grid gap-3 border-t border-slate-900/10 p-4 dark:border-white/10 md:grid-cols-5">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Name</label>
                <input className="input mt-1" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Pikachu" />
              </div>

              <MultiSelectDropdown
                id="set"
                title="Set"
                options={sets.map((s) => ({ value: s.id, label: s.name || s.id }))}
                selected={setIds}
                onChange={setSetIds}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
              />

              <MultiSelectDropdown
                id="rarity"
                title="Rarity"
                options={RARITY_OPTIONS}
                selected={rarities}
                onChange={setRarities}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
              />

              <MultiSelectDropdown
                id="supertype"
                title="Supertype"
                options={SUPERTYPE_OPTIONS}
                selected={supertypes}
                onChange={setSupertypes}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
              />

              <MultiSelectDropdown
                id="type"
                title="Type"
                options={TYPE_OPTIONS}
                selected={types}
                onChange={setTypes}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setNameInput('');
              setNameQuery('');
              setSetIds([]);
              setRarities([]);
              setSupertypes([]);
              setTypes([]);
              setOpenDropdownId(null);
            }}
          >
            Clear
          </button>

          <div className="text-slate-600 dark:text-slate-400">
            {cards.length ? `${cards.length} loaded` : ''}
            <span className="ml-3 text-xs opacity-80">
              Grid: {cols} (max {gridPrefs.maxCols}, min {cardSize.minTilePx}px)
            </span>
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

      <div
        ref={gridContainerRef}
        className={`w-full ${(filtersOpen && openDropdownId) ? 'pointer-events-none' : ''}`}
      >
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
