async function tableExists(queryInterface, tableName) {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch {
    return false;
  }
}

export default {
  async up(queryInterface, Sequelize) {
    const hasTrades = await tableExists(queryInterface, 'Trades');

    if (!hasTrades) {
      await queryInterface.createTable('Trades', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        initiatorId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE'
        },
        recipientId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE'
        },
        status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
        activeOfferId: { type: Sequelize.INTEGER, allowNull: true },
        hiddenByInitiator: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        hiddenByRecipient: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        createdAt: { allowNull: false, type: Sequelize.DATE },
        updatedAt: { allowNull: false, type: Sequelize.DATE }
      });
    } else {
      const tradesCols = await queryInterface.describeTable('Trades');
      if (!tradesCols.activeOfferId) await queryInterface.addColumn('Trades', 'activeOfferId', { type: Sequelize.INTEGER, allowNull: true });
      if (!tradesCols.hiddenByInitiator) await queryInterface.addColumn('Trades', 'hiddenByInitiator', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
      if (!tradesCols.hiddenByRecipient) await queryInterface.addColumn('Trades', 'hiddenByRecipient', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
      if (!tradesCols.initiatorId) await queryInterface.addColumn('Trades', 'initiatorId', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }

    if (!(await tableExists(queryInterface, 'TradeOffers'))) {
      await queryInterface.createTable('TradeOffers', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        tradeId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Trades', key: 'id' },
          onDelete: 'CASCADE'
        },
        version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        proposerId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE'
        },
        message: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { allowNull: false, type: Sequelize.DATE },
        updatedAt: { allowNull: false, type: Sequelize.DATE }
      });
    }

    if (!(await tableExists(queryInterface, 'TradeOfferItems'))) {
      await queryInterface.createTable('TradeOfferItems', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        offerId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'TradeOffers', key: 'id' },
          onDelete: 'CASCADE'
        },
        ownerId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE'
        },
        collectionItemId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'CollectionItems', key: 'id' },
          onDelete: 'SET NULL'
        },
        cardId: { type: Sequelize.STRING, allowNull: false },
        quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        createdAt: { allowNull: false, type: Sequelize.DATE },
        updatedAt: { allowNull: false, type: Sequelize.DATE }
      });
    }

    if (!(await tableExists(queryInterface, 'TradeMessages'))) {
      await queryInterface.createTable('TradeMessages', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        tradeId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Trades', key: 'id' },
          onDelete: 'CASCADE'
        },
        senderId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE'
        },
        message: { type: Sequelize.TEXT, allowNull: false },
        createdAt: { allowNull: false, type: Sequelize.DATE },
        updatedAt: { allowNull: false, type: Sequelize.DATE }
      });
    }

    if (!(await tableExists(queryInterface, 'TradeReadStates'))) {
      await queryInterface.createTable('TradeReadStates', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        tradeId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Trades', key: 'id' },
          onDelete: 'CASCADE'
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE'
        },
        lastReadAt: { type: Sequelize.DATE, allowNull: true },
        createdAt: { allowNull: false, type: Sequelize.DATE },
        updatedAt: { allowNull: false, type: Sequelize.DATE }
      });
    }

    const [indexes] = await queryInterface.sequelize.query("PRAGMA index_list('TradeReadStates')");
    const hasUnique = indexes.some((idx) => idx.name === 'trade_read_states_trade_user_unique');
    if (!hasUnique) {
      await queryInterface.addIndex('TradeReadStates', ['tradeId', 'userId'], {
        unique: true,
        name: 'trade_read_states_trade_user_unique'
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('TradeReadStates', 'trade_read_states_trade_user_unique').catch(() => {});
    await queryInterface.dropTable('TradeReadStates').catch(() => {});
    await queryInterface.dropTable('TradeMessages').catch(() => {});
    await queryInterface.dropTable('TradeOfferItems').catch(() => {});
    await queryInterface.dropTable('TradeOffers').catch(() => {});
    await queryInterface.dropTable('Trades').catch(() => {});
  }
};
