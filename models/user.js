export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  });

  User.associate = (models) => {
    User.hasMany(models.CollectionItem, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasMany(models.WishlistItem, { foreignKey: 'userId', onDelete: 'CASCADE' });
  };

  return User;
};
