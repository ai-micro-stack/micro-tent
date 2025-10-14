require("module-alias/register");
const { shellStream } = require("@utils/taskShellStream");
// const { shellStream } = require("@utils/taskShellExecute");
// const { ssh2Stream } = require("@utils/taskSsh2Stream");

const cmds = [`sudo su`, `yes | apt update`, `ls -la`];

const host = "192.168.8.196";
const user = {
  username: "pxeboot",
  password: "pxeboot",
};

shellStream(cmds, "pxeboot");
// ssh2Stream(cmds, host, user.username, user.password);
