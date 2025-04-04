'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('Users', "email", "username");
    await queryInterface.renameColumn('Users', "name", "password");
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};
