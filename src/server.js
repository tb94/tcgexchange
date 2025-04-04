require('dotenv').config();
const express = require('express');
const cors = require('cors');
const usersRoutes = require('./routes/users');
const cardRoutes = require('./routes/cards');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', usersRoutes);
app.use('/cards', cardRoutes);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
