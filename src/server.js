require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const usersRoutes = require('./routes/users');
const cardRoutes = require('./routes/cards');
const collectionRoutes = require('./routes/collection');
const wishlistRoutes = require('./routes/wishlist');

const { sequelize } = require('../models');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// Legacy static HTML pages are disabled; we serve only the React app + APIs.

// React rewrite POC build (Vite)
const reactDist = path.join(__dirname, '..', 'client', 'dist');
app.use('/assets', express.static(path.join(reactDist, 'assets')));
app.use('/vite.svg', express.static(path.join(reactDist, 'vite.svg')));

app.use('/auth', usersRoutes);
app.use('/cards', cardRoutes);
app.use('/collection', collectionRoutes);
app.use('/wishlist', wishlistRoutes);

// SPA fallback for React routes (make React the default UI)
app.get(['/', '/app', '/app/*'], (req, res) => {
  res.sendFile(path.join(reactDist, 'index.html'));
});

(async () => {
  // Keep SQLite schema in sync for simple, local-dev style deployments.
  // This will add new nullable columns (like CollectionItem.notes) automatically.
  await sequelize.sync({ alter: true });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})().catch((e) => {
  console.error('Failed to start server:', e);
  process.exit(1);
});
