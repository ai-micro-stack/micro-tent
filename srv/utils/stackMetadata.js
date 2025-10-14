require("module-alias/register");
// const User = require("@models/user.model");
const Role = require("@models/role.model");
// const Resource = require("@models/resource.model");
// const Permission = require("@models/permission.model");
const { Op } = require("sequelize");

const StackMetadata = () => {
  try {
    Role.sync({ force: true, alter: false })
      .then(function () {
        console.log("database is synced with model Role");

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

module.exports = { StackMetadata };
