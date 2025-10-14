require("module-alias/register");
const express = require("express");
const router = express.Router();
const User = require("@models/user.model");
const md5 = require("md5");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const dbTableCheck = require("@utils/dbTableCheck");
const stackFirstUser = require("@utils/stackFirstUser");

const environment = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
dotenv.config({ path: `.env.${environment}` });
const { JWT_SECRET_KEY } = process.env;

// User self registration (not in use yet)
router.get("/mode", async (req, res) => {
  try {
    dbTableCheck("users")
      .then((ret) => {
        res.status(201).json({ state: ret.count === 0 ? "config" : "using" });
      })
      .catch((error) => {
        throw new Error(error);
      });
  } catch (error) {
    res.status(500).json({ error: "Api internal failure." });
  }
});

// Register first user
router.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    stackFirstUser({ username, password, email }).then((result) =>
      res.status(201).json(result)
    );
  } catch (err) {
    res.status(500).json({
      state: -1,
      message: JSON.stringify(err),
    });
  }
});

// User login
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await md5(password);
    const user = await User.findOne({
      where: { username, password: hashedPassword, active: 1 },
    });
    if (!user) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const passwordMatch = user.password === md5(password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const refreshToken = jwt.sign(
      { userId: user.uuid },
      `${JWT_SECRET_KEY}@REF`,
      {
        expiresIn: "15d",
      }
    );
    delete user.password;
    res.status(200).json({ refreshToken, user });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// User access token refresh
router.post("/fetch", async (req, res, next) => {
  try {
    const modeState = await dbTableCheck("users");
    if (modeState.count === 0)
      return res.status(401).json({ error: "No user is registered yet" });

    const { refreshToken } = req.body;
    jwt.verify(refreshToken, `${JWT_SECRET_KEY}@REF`, async (err, decoded) => {
      if (err) {
        console.log("Token is invalid");
        return res.status(401).json({ error: "Authentication expired" });
      } else {
        // console.log("Decoded Token:", decoded);
        const user = await User.findOne({
          where: { uuid: decoded.userId, active: 1 },
        });
        if (!user) {
          return res.status(401).json({ error: "Authentication failed" });
        }
        const refreshToken = jwt.sign(
          { userId: user.uuid },
          `${JWT_SECRET_KEY}@REF`,
          {
            expiresIn: "15d",
          }
        );
        const accessToken = jwt.sign(
          { userId: user.uuid, roleId: user.role_id },
          `${JWT_SECRET_KEY}@ACC`,
          {
            expiresIn: "2h",
          }
        );
        delete user.password;
        res.status(200).json({ refreshToken, accessToken, user });
      }
    });
  } catch {}
});

module.exports = router;
