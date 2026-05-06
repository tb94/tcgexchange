import React, { useMemo, useState } from 'react';

const TYPES = ['Colorless', 'Darkness', 'Dragon', 'Fairy', 'Fighting', 'Fire', 'Grass', 'Lightning', 'Metal', 'Psychic', 'Water'];
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Double Rare', 'Illustration Rare', 'Special Illustration Rare', 'Hyper Rare'];
const SUPERTYPES = ['Pokémon', 'Trainer', 'Energy'];

function cardLabel(item) {
  const card = item.card || {};
  const set = card.setName ? ` — ${card.setName}` : '';
  const num = card.number ? ` #${card.number}` : '';
  return `${card.name || item.cardId}${set}${num}`;
}

function matchesFilters(item, filters) {
  const card = item.card || {};
  const name = String(card.name || item.cardId || '').toLowerCase();
  const setId = String(card.setId || '').toLowerCase();
  const setName = String(card.setName || '').toLowerCase();
  const types = Array.isArray(card.types) ? card.types : [];

  if (filters.name && !name.includes(filters.name.toLowerCase())) return false;
  if (filters.setText && !setId.includes(filters.setText.toLowerCase()) && !setName.includes(filters.setText.toLowerCase())) return false;
  if (filters.rarities.length && !filters.rarities.includes(card.rarity)) return false;
  if (filters.supertypes.length && !filters.supertypes.includes(card.supertype)) return false;
  if (filters.types.length && !filters.types.some((value) => types.includes(value))) return false;
  if (filters.wishedOnly && !item.wishedByOther) return false;
  return true;
}

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

function CheckboxGroup({ title, options, selected, onChange }) {
  const allSelected = options.length > 0 && selected.length === options.length;
  return (
    <div className="rounded-xl border border-slate-900/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">{title}</div>
        <button type="button" className="text-xs font-semibold text-sky-700 dark:text-cyan-300" onClick={() => onChange(allSelected ? [] : options)}>
          {allSelected ? 'Clear all' : 'Select all'}
        </button>
      </div>
      <div className="mt-2 grid max-h-40 gap-2 overflow-auto pr-1">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.includes(option)} onChange={() => onChange(toggleValue(selected, option))} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FilterDrawer({ filters, setFilters }) {
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="grid gap-2 md:grid-cols-3">
        <input
          className="input"
          value={filters.name}
          onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Search name"
        />
        <input
          className="input"
          value={filters.setText}
          onChange={(e) => setFilters((prev) => ({ ...prev, setText: e.target.value }))}
          placeholder="Set name or id"
        />
        <CheckboxGroup
          title="Rarity"
          options={RARITIES}
          selected={filters.rarities}
          onChange={(values) => setFilters((prev) => ({ ...prev, rarities: values }))}
        />
        <CheckboxGroup
          title="Supertype"
          options={SUPERTYPES}
          selected={filters.supertypes}
          onChange={(values) => setFilters((prev) => ({ ...prev, supertypes: values }))}
        />
        <CheckboxGroup
          title="Type"
          options={TYPES}
          selected={filters.types}
          onChange={(values) => setFilters((prev) => ({ ...prev, types: values }))}
        />
        <label className="flex items-center gap-2 rounded-xl border border-slate-900/10 px-3 py-2 text-sm dark:border-white/10">
          <input
            type="checkbox"
            checked={filters.wishedOnly}
            onChange={(e) => setFilters((prev) => ({ ...prev, wishedOnly: e.target.checked }))}
          />
          Wished-for only
        </label>
      </div>
      <button
        type="button"
        className="btn btn-ghost mt-2"
        onClick={() => setFilters({ name: '', setText: '', rarities: [], supertypes: [], types: [], wishedOnly: false })}
      >
        Clear filters
      </button>
    </div>
  );
}

function CardPicker({ title, subtitle, items, selected, setSelected }) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    setText: '',
    rarities: [],
    supertypes: [],
    types: [],
    wishedOnly: false
  });

  const filtered = useMemo(
    () => items.filter((item) => matchesFilters(item, filters)),
    [filters, items]
  );

  function toggle(item) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[item.id]) delete next[item.id];
      else {
        next[item.id] = {
          collectionItemId: item.id,
          ownerId: item.userId,
          cardId: item.cardId,
          quantity: 1
        };
      }
      return next;
    });
  }

  function setQty(item, quantity) {
    setSelected((prev) => ({
      ...prev,
      [item.id]: {
        ...(prev[item.id] || {
          collectionItemId: item.id,
          ownerId: item.userId,
          cardId: item.cardId
        }),
        quantity
      }
    }));
  }

  return (
    <div className="rounded-2xl border border-slate-900/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-bold">{title}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">{subtitle}</div>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => setShowFilters((v) => !v)}>
          ☰ Filters
        </button>
      </div>

      {showFilters && <div className="mt-3"><FilterDrawer filters={filters} setFilters={setFilters} /></div>}

      <div className="mt-3 max-h-[46vh] overflow-auto pr-1">
        <div className="grid gap-2">
          {filtered.map((item) => {
            const isSelected = !!selected[item.id];
            return (
              <label
                key={item.id}
                className={
                  `flex cursor-pointer gap-3 rounded-xl border p-3 text-sm `
                  + (item.wishedByOther
                    ? 'border-amber-400/50 bg-amber-300/10 '
                    : 'border-slate-900/10 bg-white/60 dark:border-white/10 dark:bg-white/5 ')
                  + (isSelected ? 'ring-2 ring-neonCyan/40' : '')
                }
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(item)}
                />
                {item.card?.imageSmall ? (
                  <img
                    src={item.card.imageSmall}
                    alt={item.card?.name || item.cardId}
                    className="h-16 w-11 rounded object-cover ring-1 ring-black/5 dark:ring-white/10"
                    loading="lazy"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{cardLabel(item)}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {item.condition} · owned x{item.quantity}
                    {item.wishedByOther ? ' · wished for by the other trader' : ''}
                  </div>
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Qty</span>
                      <input
                        className="input max-w-20 py-1"
                        type="number"
                        min="1"
                        max={item.quantity}
                        value={selected[item.id]?.quantity || 1}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setQty(item, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </label>
            );
          })}
          {!filtered.length && (
            <div className="rounded-xl border border-slate-900/10 p-3 text-sm text-slate-500 dark:border-white/10">
              No cards match these filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TradeBuilderModal({
  title = 'Create Trade Offer',
  builder,
  initialSelected = {},
  initialMessage = '',
  sendLabel = 'Send offer',
  onClose,
  onSubmit
}) {
  const [selected, setSelected] = useState(initialSelected);
  const [message, setMessage] = useState(initialMessage);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  const selectedItems = Object.values(selected);
  const me = builder?.participants?.me;
  const otherUser = builder?.participants?.otherUser;

  async function submit() {
    setErr('');
    if (!selectedItems.length) {
      setErr('Select at least one card from either collection.');
      return;
    }
    setSending(true);
    try {
      await onSubmit({ message, items: selectedItems });
    } catch (e) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-6xl overflow-auto rounded-2xl border border-slate-900/10 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#0b1220]/95">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xl font-bold">{title}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Build an offer between {me?.username || 'you'} and {otherUser?.username || 'the other trader'}.
            </div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>

        {err && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm">{err}</div>}

        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Comment/message to include with the trade
          </label>
          <textarea
            className="input mt-1 min-h-24"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message the other trader will see…"
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <CardPicker
            title={`${me?.username || 'Your'} collection`}
            subtitle="Cards you can offer. Highlighted cards are on their wishlist."
            items={builder?.collections?.me || []}
            selected={selected}
            setSelected={setSelected}
          />
          <CardPicker
            title={`${otherUser?.username || 'Other trader'} collection`}
            subtitle="Cards you are requesting. Highlighted cards are on your wishlist."
            items={builder?.collections?.otherUser || []}
            selected={selected}
            setSelected={setSelected}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-900/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="font-bold">Offer summary</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {selectedItems.length} card line(s) selected. Use both sides to build an even trade.
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={sending}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={sending || !selectedItems.length}>
            {sending ? 'Sending…' : sendLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
