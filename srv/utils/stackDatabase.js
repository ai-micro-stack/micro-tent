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
const Role = require("@models/role.model");
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
      
    Role.sync({ force: true, alter: false })
      .then(function () {
        console.log("database is synced with model of Role");

        const expectedRoles = [
          { id: 1, role: "Admin" },
          { id: 2, role: "User" },
          { id: 3, role: "Viewer" },
          { id: 9, role: "Demo" },
        ];
        // Role.bulkCreate(expectedRoles);

        Role.destroy({
          where: {
            id: {
              [Op.lt]: 1,
              [Op.gt]: 3,
            },
          },
        }).then(() =>
          expectedRoles.forEach((e) => {
            Role.findCreateFind({
              where: { ...e },
            });
          })
        );
      })
      .catch(function (err) {
        console.log(err);
      });

    // Resource.sync({ force: false, alter: true })
    //   .then(function () {
    //     console.log("database is synced with model");
    //     const expectedResources = [
    //       { id: 0, resource: "" },
    //       { id: 1, resource: "rack-builder" },
    //       { id: 2, resource: "rack-service" },
    //       { id: 3, resource: "os-upload" },
    //       { id: 4, resource: "boot-image" },
    //       { id: 5, resource: "static-client" },
    //       { id: 6, resource: "team-user" },
    //     ];
    //     // Resource.bulkCreate(expectedResources);

    //     Resource.destroy({
    //       where: {
    //         id: {
    //           [Op.lt]: 0,
    //           [Op.gt]: 5,
    //         },
    //       },
    //     }).then(() =>
    //       expectedResources.forEach((e) => {
    //         Resource.findCreateFind({
    //           where: {
    //             id: e.id,
    //             resource: e.resource,
    //           },
    //         });
    //       })
    //     );
    //   })
    //   .catch(function (err) {
    //     console.log(err);
    //   });

    // Permission.sync({ force: false, alter: true })
    //   .then(function () {
    //     console.log("database is synced with model");
    //     const expectedPermissions = [
    //       { resource_id: 1, role_id: 1 },
    //       { resource_id: 2, role_id: 1 },
    //       { resource_id: 2, role_id: 2 },
    //       { resource_id: 2, role_id: 3 },
    //       { resource_id: 3, role_id: 1 },
    //       { resource_id: 3, role_id: 2 },
    //       { resource_id: 4, role_id: 1 },
    //       { resource_id: 5, role_id: 1 },
    //     ];
    //     // Permission.bulkCreate(expectedPermissions);

    //     Permission.destroy({
    //       where: {},
    //       truncate: true,
    //     }).then(() =>
    //       expectedPermissions.forEach((e) => {
    //         Permission.findCreateFind({
    //           where: {
    //             resource_id: e.resource_id,
    //             role_id: e.role_id,
    //           },
    //         });
    //       })
    //     );
    //   })
    //   .catch(function (err) {
    //     console.log(err);
    //   });

    // User.sync({ force: false, alter: true })
    //   .then(function () {
    //     console.log("database is synced with model");
    //   })
    //   .catch(function (err) {
    //     console.log(err);
    //   });

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
