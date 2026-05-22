import path from 'path';
import Sequelize from 'sequelize';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import defineUser from './user.js';
import defineWishlistItem from './wishlistItem.js';
import defineCollectionItem from './collectionItem.js';
import defineCardCache from './cardCache.js';
import defineTrade from './trade.js';
import defineTradeOffer from './tradeOffer.js';
import defineTradeOfferItem from './tradeOfferItem.js';
import defineTradeMessage from './tradeMessage.js';
import defineTradeReadState from './tradeReadState.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const configJson = require('../config/config.json');

const env = process.env.NODE_ENV || 'development';
const config = configJson[env];

// Make SQLite storage path stable across restarts (resolve relative to repo root).
const resolvedConfig = { ...config };
if (resolvedConfig?.dialect === 'sqlite' && resolvedConfig.storage) {
  resolvedConfig.storage = path.resolve(__dirname, '..', resolvedConfig.storage);
}

const sequelize = resolvedConfig.use_env_variable
  ? new Sequelize(process.env[resolvedConfig.use_env_variable], resolvedConfig)
  : new Sequelize(
    resolvedConfig.database,
    resolvedConfig.username,
    resolvedConfig.password,
    resolvedConfig
  );

// Models
const User = defineUser(sequelize, Sequelize.DataTypes);
const WishlistItem = defineWishlistItem(sequelize, Sequelize.DataTypes);
const CollectionItem = defineCollectionItem(sequelize, Sequelize.DataTypes);
const CardCache = defineCardCache(sequelize, Sequelize.DataTypes);
const Trade = defineTrade(sequelize, Sequelize.DataTypes);
const TradeOffer = defineTradeOffer(sequelize, Sequelize.DataTypes);
const TradeOfferItem = defineTradeOfferItem(sequelize, Sequelize.DataTypes);
const TradeMessage = defineTradeMessage(sequelize, Sequelize.DataTypes);
const TradeReadState = defineTradeReadState(sequelize, Sequelize.DataTypes);

const models = {
  User,
  WishlistItem,
  CollectionItem,
  CardCache,
  Trade,
  TradeOffer,
  TradeOfferItem,
  TradeMessage,
  TradeReadState
};

// Associations
Object.values(models).forEach((model) => {
  if (model?.associate) model.associate(models);
});

const db = {
  Sequelize,
  sequelize,
  User,
  WishlistItem,
  CollectionItem,
  CardCache,
  Trade,
  TradeOffer,
  TradeOfferItem,
  TradeMessage,
  TradeReadState
};

export {
  Sequelize,
  sequelize,
  User,
  WishlistItem,
  CollectionItem,
  CardCache,
  Trade,
  TradeOffer,
  TradeOfferItem,
  TradeMessage,
  TradeReadState
};
export default db;
