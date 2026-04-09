export default (sequelize, DataTypes) => {
  const WishlistItem = sequelize.define('WishlistItem', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cardId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    minCondition: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'LP'
    },
    quantityDesired: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  WishlistItem.associate = (models) => {
    WishlistItem.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
  };

  return WishlistItem;
};
