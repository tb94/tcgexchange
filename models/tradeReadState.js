export default (sequelize, DataTypes) => {
  const TradeReadState = sequelize.define('TradeReadState', {
    tradeId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    lastReadAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  TradeReadState.associate = (models) => {
    TradeReadState.belongsTo(models.Trade, { foreignKey: 'tradeId', onDelete: 'CASCADE' });
    TradeReadState.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
  };

  return TradeReadState;
};
