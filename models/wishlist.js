module.exports = (sequelize, DataTypes) => {
  const Wishlist = sequelize.define('Wishlist', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cardId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cardName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
    },
    supertype: {
      type: DataTypes.STRING,
    },
    subtype: {
      type: DataTypes.STRING,
    },
    rarity: {
      type: DataTypes.STRING,
    }
  }, {
    timestamps: true
  });

  Wishlist.associate = function(models) {
    Wishlist.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Wishlist;
};