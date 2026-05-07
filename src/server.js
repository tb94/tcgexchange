import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import usersRoutes from './routes/users.js';
import cardRoutes from './routes/cards.js';
import collectionRoutes from './routes/collection.js';
import wishlistRoutes from './routes/wishlist.js';
import tradesRoutes from './routes/trades.js';
import adminRoutes from './routes/admin.js';

import { sequelize } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// Legacy static HTML pages are disabled; we serve only the React app + APIs.

// React build (Vite)
const reactDist = path.join(__dirname, '..', 'client', 'dist');
app.use('/assets', express.static(path.join(reactDist, 'assets')));
app.use('/vite.svg', express.static(path.join(reactDist, 'vite.svg')));

app.use('/auth', usersRoutes);
app.use('/cards', cardRoutes);
app.use('/collection', collectionRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/trades', tradesRoutes);
app.use('/admin', adminRoutes);

// SPA fallback for React routes (make React the default UI)
app.get(['/', '/app', '/app/*'], (req, res) => {
  res.sendFile(path.join(reactDist, 'index.html'));
});

(async () => {
  // Keep SQLite schema in sync for simple, local-dev style deployments.
  // SQLite + alter can trip FK/unique constraint checks if a prior alter crashed and left *_backup tables behind.
  try {
    await sequelize.query('PRAGMA foreign_keys = OFF');

    const [rows] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_backup'"
    );

    // eslint-disable-next-line no-restricted-syntax
    for (const r of rows || []) {
      const name = r?.name;
      if (!name) continue;
      // eslint-disable-next-line no-await-in-loop
      await sequelize.query(`DROP TABLE IF EXISTS \`${name}\``);
    }
  } catch (e) {
    // ignore
  }

  await sequelize.sync({ alter: true });

  try { await sequelize.query('PRAGMA foreign_keys = ON'); } catch (e) { /* ignore */ }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})().catch((e) => {
  console.error('Failed to start server:', e);
  process.exit(1);
});
