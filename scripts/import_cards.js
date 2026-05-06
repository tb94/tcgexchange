import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { CardCache, sequelize } from '../models/index.js';
import setConverter from '../src/util/setConverter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.POKEMON_TCG_DATA_DIR || path.join(__dirname, '..', 'data', 'pokemon-tcg-data');

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

async function run() {
  const cardsPath = path.join(DATA_DIR, 'cards', 'en.json');
  if (!fs.existsSync(cardsPath)) {
    throw new Error(`Missing data file: ${cardsPath} (set POKEMON_TCG_DATA_DIR to your dataset root)`);
  }

  const raw = fs.readFileSync(cardsPath, 'utf8');
  const cards = safeJsonParse(raw);
  if (!Array.isArray(cards)) {
    throw new Error('Expected cards JSON to be an array');
  }

  await sequelize.sync();

  const BATCH = 1000;
  for (let i = 0; i < cards.length; i += BATCH) {
    const chunk = cards.slice(i, i + BATCH);

    // eslint-disable-next-line no-await-in-loop
    await CardCache.bulkCreate(
      chunk.map((c) => {
        const setId = c.set?.id;
        const setName = c.set?.name;

        return {
          id: c.id,
          name: c.name,
          setId,
          setName,
          setSeries: c.set?.series,
          setReleaseDate: c.set?.releaseDate,
          setPrintedTotal: c.set?.printedTotal,
          number: c.number,
          hp: c.hp,
          rarity: c.rarity,
          supertype: c.supertype,
          subtypesJson: JSON.stringify(c.subtypes || []),
          typesJson: JSON.stringify(c.types || []),
          imageSmall: c.images?.small,
          imageLarge: c.images?.large
        };
      }),
      { updateOnDuplicate: ['name', 'setId', 'setName', 'setSeries', 'setReleaseDate', 'setPrintedTotal', 'number', 'hp', 'rarity', 'supertype', 'subtypesJson', 'typesJson', 'imageSmall', 'imageLarge'] }
    );

    if (i % (BATCH * 10) === 0) {
      // eslint-disable-next-line no-console
      console.log(`Imported ${Math.min(i + BATCH, cards.length)} / ${cards.length}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log('Import complete');
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
