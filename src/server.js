require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const usersRoutes = require('./routes/users');
const cardRoutes = require('./routes/cards');
const collectionRoutes = require('./routes/collection');
const wishlistRoutes = require('./routes/wishlist');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// Static assets (legacy)
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'public', 'views')));

// React rewrite POC build (Vite)
const reactDist = path.join(__dirname, '..', 'client', 'dist');
app.use('/assets', express.static(path.join(reactDist, 'assets')));
app.use('/vite.svg', express.static(path.join(reactDist, 'vite.svg')));

app.use('/auth', usersRoutes);
app.use('/cards', cardRoutes);
app.use('/collection', collectionRoutes);
app.use('/wishlist', wishlistRoutes);

// SPA fallback for React routes
app.get(['/app', '/app/*'], (req, res) => {
  res.sendFile(path.join(reactDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
