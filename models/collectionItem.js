export default (sequelize, DataTypes) => {
  const CollectionItem = sequelize.define('CollectionItem', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cardId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    condition: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'NM'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  CollectionItem.associate = (models) => {
    CollectionItem.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
  };

  return CollectionItem;
};
