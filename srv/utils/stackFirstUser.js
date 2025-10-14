require("module-alias/register");
const User = require("@models/user.model");
const { createUUID } = require("@database/db.utils");
const { getConfValue } = require("@utils/stackParser");
const dbTableCheck = require("@utils/dbTableCheck");
const md5 = require("md5");

const stackFirstUser = async ({ username, password, email }) => {
  try {
    const ret = await dbTableCheck("users");
    if (ret.count > 0) {
      return {
        state: 1,
        message:
          "Feature is not avaialble as the first user is created already.",
      };
    }
    const hashedPassword = md5(password);
    const defaultDomain = getConfValue("dhcpDomain") || "localhost";
    const user = {
      uuid: createUUID(),
      username: username,
      email: email ?? `${username}@${defaultDomain}`,
      password: hashedPassword,
      role_id: 1,
      active: 1,
      fullname: `${username}`,
    };
    await User.sync({ force: false, alter: true });
    await User.create(user);
    return {
      state: 0,
      message: "Succeeded to create the first user.",
    };
  } catch (err) {
    return {
      state: -1,
      message: JSON.stringify(err),
    };
  }
};

module.exports = stackFirstUser;
