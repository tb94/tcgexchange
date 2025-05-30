require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const usersRoutes = require('./routes/users');
const cardRoutes = require('./routes/cards');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'public', 'views')));

app.use('/auth', usersRoutes);
app.use('/cards', cardRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
