# Matching Fixture

This repo includes a small 5-user fixture for testing trade matching across collection and wishlist data.

## Run it

```bash
npm run seed:matching-fixture
```

All fixture users share this test password:

```text
tcgtest123
```

Fixture users:

- `match_ash`
- `match_misty`
- `match_brock`
- `match_leaf`
- `match_red`

To preview the fixture and the expected top matches without touching the database:

```bash
npm run seed:matching-fixture:preview
```

To remove the fixture users and their collection/wishlist rows:

```bash
node scripts/seed_matching_fixture.js --reset
```

## Why these users are useful

The data is intentionally interwoven:

- Some users have exact high-priority wants that another user owns.
- Some matches are reciprocal, so the app can surface likely trades instead of only one-way leads.
- Some cards fail condition requirements, so condition filtering can be tested.
- Quantities vary, especially on common cards, so quantity matching can be tested.
- Priorities vary from `1` through `5`, so scoring/ranking can be tested.

## First-pass matching algorithm

A practical first version can be:

1. For every pair of users, compare user A's wishlist to user B's collection.
2. A directed match exists when:
   - `wishlist.cardId === collection.cardId`
   - collection condition is at least the wishlist `minCondition`
   - available quantity is greater than zero
3. Score the directed match:
   - Priority: `6 - priority`, so priority `1` is strongest.
   - Quantity: `min(quantityDesired, quantityOwned)`.
   - Condition bonus: extra points when offered condition beats the requested minimum.
4. Add a reciprocal bonus if B also wants anything A owns.
5. Sort by score and show:
   - two-way matches first/highest
   - high-priority wants
   - best condition/quantity fit

The seed script's preview uses this sample formula:

```text
score = ((6 - priority) * 10) + (quantityMatched * 2) + conditionBonus + reciprocalBonus
reciprocalBonus = 25 when both users can satisfy at least one want for each other
```

## Next algorithm improvements

Good follow-ups once the basic endpoint/UI works:

- Track whether a collection item is actually available for trade.
- Add card market value to avoid lopsided trade suggestions.
- Support multi-card trades, e.g. two lower-value cards for one higher-value card.
- Respect user distance/shipping preference.
- Deduct matched quantities while building bundles, so one owned card is not promised to multiple people.
