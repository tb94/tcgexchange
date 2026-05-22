export default (sequelize, DataTypes) => {
  const TradeOffer = sequelize.define('TradeOffer', {
    tradeId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    proposerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  TradeOffer.associate = (models) => {
    TradeOffer.belongsTo(models.Trade, { foreignKey: 'tradeId', onDelete: 'CASCADE' });
    TradeOffer.belongsTo(models.User, { as: 'proposer', foreignKey: 'proposerId' });
    TradeOffer.hasMany(models.TradeOfferItem, { foreignKey: 'offerId', onDelete: 'CASCADE' });
  };

  return TradeOffer;
};
