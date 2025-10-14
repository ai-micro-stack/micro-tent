require("module-alias/register");
const express = require("express");
const router = express.Router();
const Role = require("@models/role.model");
const User = require("@models/user.model");
const { createUUID } = require("@database/db.utils");
const { getConfValue } = require("@utils/stackParser");
const md5 = require("md5");
const { verifyToken, grantAccess } = require("@middleware/authMiddleware");

router.get("/roles", async (req, res) => {
  try {
    await Role.findAll({
      attributes: ["id", "role"],
    })
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch((error) => {
        return res.status(400).json({
          message: `Unable to fetch records! ${error}`,
        });
      });
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.get(
  "/members",
  verifyToken,
  grantAccess([1, 2, 9]),
  async (req, res) => {
    try {
      await User.findAll({
        attributes: [
          "uuid",
          "username",
          "fullname",
          "email",
          "role_id",
          "createdDate",
          "active",
        ],
        // where: { uuid: req.params.uuid },
      })
        .then((result) => {
          return res
            .status(200)
            .json({ dhcpDomain: getConfValue("dhcpDomain"), members: result });
        })
        .catch((error) => {
          return res.status(400).json({
            message: `Unable to fetch records! ${error}`,
          });
        });
    } catch (err) {
      return res.status(500).send(err);
    }
  }
);

router.get(
  "/member/:uuid",
  verifyToken,
  grantAccess([1, 2, 9]),
  async (req, res) => {
    try {
      await User.findOne({ where: { uuid: req.params.uuid } })
        .then((result) => {
          return res.status(200).json(result);
        })
        .catch((error) => {
          return res.status(400).json({
            message: `Unable to fetch records! ${error}`,
          });
        });
    } catch (err) {
      return res.status(500).send(err);
    }
  }
);

router.post("/create", verifyToken, grantAccess([1, 2]), async (req, res) => {
  let { username, fullname, email, password, role_id, active } = req.body;

  if (!username || !password) {
    return res.status(202).json({ message: "Insufficient data provided." });
  }

  // const userCheck = await User.findOne({ where: { username } });
  // if (userCheck) {
  //   return res.status(500).json({
  //     message: `Username exists already! ${error}`,
  //   });
  // }

  let user = User.build({
    uuid: createUUID(),
    username: username,
    fullname: fullname ? fullname : username,
    email: email ? email : username + "@" + getConfValue("dhcpDomain"),
    password: md5(password),
    role_id: role_id ? role_id : 0,
    active: active ? active : true,
  });
  await user
    .save()
    .then((result) => {
      return res.status(200).json({
        message: "Record created successfully.",
        entity: result,
      });
    })
    .catch((error) => {
      return res.status(500).json({
        message: `Unable to save the member data! ${error}`,
      });
    });
});

router.post("/update", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const user = await User.findOne({ where: { uuid: req.body.uuid } });
  if (!user) {
    return res.status(202).json({
      message: `user not found: ${req.body.uuid}`,
    });
  }
  user.username = req.body.username;
  user.fullname = req.body.fullname;
  user.email = req.body.email;

  if (req.body.password) {
    console.log(`password updated for: ${user.username}`);
    user.password = md5(req.body.password);
  }
  user.role_id = req.body.role_id;
  user.active = req.body.active;
  await user
    .save()
    .then((result) => {
      return res.status(200).json({
        message: "Record updated successfully.",
        entity: result,
      });
    })
    .catch((error) => {
      return res.status(400).json({
        message: `Unable to update record! ${error}`,
      });
    });
});

router.delete("/delete", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const memberId = String(req.headers["x-member-uuid"]);
  const user = await User.findByPk(memberId);
  if (!user) {
    return res.status(202).json({ message: `Record not found: ${memberId}` });
  } else {
    await user
      .destroy()
      .then((result) => {
        return res.status(200).json({
          message: "Record deleted successfully.",
          entity: `${JSON.stringify(result)}`,
        });
      })
      .catch((error) => {
        return res.status(400).json({
          message: `Unable to delete record! ${error}`,
        });
      });
  }
});

module.exports = router;
