'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('Users', "email", "username");
    await queryInterface.addColumn('Users', "password", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.removeColumn('Users', "name");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};
