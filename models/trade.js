export default (sequelize, DataTypes) => {
  const Trade = sequelize.define('Trade', {
    initiatorId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    activeOfferId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    hiddenByInitiator: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    hiddenByRecipient: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  });

  Trade.associate = (models) => {
    Trade.belongsTo(models.User, { as: 'initiator', foreignKey: 'initiatorId' });
    Trade.belongsTo(models.User, { as: 'recipient', foreignKey: 'recipientId' });
    Trade.hasMany(models.TradeOffer, { foreignKey: 'tradeId', onDelete: 'CASCADE' });
    Trade.hasMany(models.TradeMessage, { foreignKey: 'tradeId', onDelete: 'CASCADE' });
    Trade.hasMany(models.TradeReadState, { foreignKey: 'tradeId', onDelete: 'CASCADE' });
  };

  return Trade;
};
