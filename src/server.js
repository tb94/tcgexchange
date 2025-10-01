import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import usersRoutes from './routes/users.js';
import cardRoutes from './routes/cards.js';

const dir = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(join(dir, '..', 'public')));
app.use(express.static(join(dir, '..', 'public', 'views')));

app.use('/auth', usersRoutes);
app.use('/cards', cardRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
