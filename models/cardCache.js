export default (sequelize, DataTypes) => {
  const CardCache = sequelize.define('CardCache', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    setId: DataTypes.STRING,
    setName: DataTypes.STRING,
    setSeries: DataTypes.STRING,
    setReleaseDate: DataTypes.STRING,
    setPrintedTotal: DataTypes.INTEGER,
    number: DataTypes.STRING,
    hp: DataTypes.STRING,
    rarity: DataTypes.STRING,
    supertype: DataTypes.STRING,
    subtypesJson: DataTypes.TEXT,
    typesJson: DataTypes.TEXT,
    imageSmall: DataTypes.STRING,
    imageLarge: DataTypes.STRING
  });

  return CardCache;
};
