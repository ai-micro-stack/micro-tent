require("module-alias/register");
const Plat = require("@models/plat.model");
const Interface = require("@models/interface.model");
const Subnet = require("@models/subnet.model");
const Host = require("@models/host.model");
const Type = require("@models/type.model");
const Pxe = require("@models/pxe.model");
const Cluster = require("@models/cluster.model");
const Task = require("@models/task.model");
const Static = require("@models/static.model");
const { Op } = require("sequelize");
const { db } = require("@database/db");

const StackDatabase = () => {
  try {
    Plat.sync({ force: true, alter: false })
      .then(function () {
        console.log("database is synced with model of Plat");
        Plat.destroy({
          where: {
            id: {
              [Op.ne]: 0,
            },
          },
        });
      })
      .catch(function (err) {
        console.log(err);
      });

    Interface.sync({ force: true, alter: false })
      .then(function () {
        console.log("database is synced with model of Interface");
        Interface.destroy({
          where: {
            id: {
              [Op.ne]: 0,
            },
          },
        });
      })
      .catch(function (err) {
        console.log(err);
      });

    Subnet.sync({ force: true, alter: false })
      .then(function () {
        console.log("database is synced with model of Subnet");
        Subnet.destroy({
          where: {
            id: {
              [Op.ne]: 0,
            },
          },
        });
      })
      .catch(function (err) {
        console.log(err);
      });

    Pxe.sync({ force: true, alter: false })
      .then(function () {
        console.log("database is synced with model of Pxe");
        Pxe.destroy({
          where: {},
          // truncate: true,
        });
      })
      .catch(function (err) {
        console.log(err);
      });

    Cluster.sync({ force: true, alter: false })
      .then(function () {
        console.log("database is synced with model of Cluster");
        Cluster.destroy({
          where: {
            id: {
              [Op.ne]: 0,
            },
          },
        });
      })
      .catch(function (err) {
        console.log(err);
      });

    Host.sync({ force: true, alter: false })
      .then(function () {
        console.log("database is synced with model of Host");
        // Host.bulkCreate(expectedPermissions);

        Host.destroy({
          where: {},
          truncate: true,
        });
      })
      .catch(function (err) {
        console.log(err);
      });

    Type.sync({ force: true, alter: false })
      .then(function () {
        console.log("database is synced with model of Type");

        const expectedTypes = [
          { id: 1, type: "Admin" },
          { id: 2, type: "Master" },
          { id: 3, type: "Worker" },
        ];
        // Type.bulkCreate(expectedRoles);

        Type.destroy({
          where: {
            id: {
              [Op.lt]: 1,
              [Op.gt]: 3,
            },
          },
        }).then(() =>
          expectedTypes.forEach((e) => {
            Type.findCreateFind({
              where: {
                id: e.id,
                type: e.type,
              },
            });
          })
        );
      })
      .catch(function (err) {
        console.log(err);
      });

    Task.sync({ force: true, alter: false })
      .then(function () {
        console.log("database is synced with model of Task");
        // Host.bulkCreate(expectedPermissions);

        Task.destroy({
          where: {},
          truncate: true,
        });
      })
      .catch(function (err) {
        console.log(err);
      });

    Static.sync({ force: true, alter: false })
      .then(function () {
        console.log("database is synced with model of Static");
        // Host.bulkCreate(expectedPermissions);

        Static.destroy({
          where: {},
          truncate: true,
        });
      })
      .catch(function (err) {
        console.log(err);
      });

    return true;
  } catch (error) {
    return false;
  }
};

const StackRawQuery = async (q, options = {}) => {
  const { results, metadata } = await db.context.query(q, options);
  return { results, metadata };
};

module.exports = { StackDatabase, StackRawQuery };
