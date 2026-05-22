export default (sequelize, DataTypes) => {
  const TradeOfferItem = sequelize.define('TradeOfferItem', {
    offerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    collectionItemId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cardId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  });

  TradeOfferItem.associate = (models) => {
    TradeOfferItem.belongsTo(models.TradeOffer, { foreignKey: 'offerId', onDelete: 'CASCADE' });
    TradeOfferItem.belongsTo(models.User, { as: 'owner', foreignKey: 'ownerId' });
    TradeOfferItem.belongsTo(models.CollectionItem, { foreignKey: 'collectionItemId' });
  };

  return TradeOfferItem;
};
