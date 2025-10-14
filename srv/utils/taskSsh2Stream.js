const { Client } = require("ssh2");

function ssh2Stream(cmds, host, user, pwd) {
  const conn = new Client();

  const tunnelConfig = {
    host: `${host}`,
    port: 22,
    username: `${user}`,
    password: `${pwd}`,
  };

  const commands = cmds
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });
  let command = "";
  // let pwSent = false;
  let sudosu = false;
  let password = pwd;

  return new Promise((resolve, reject) => {
    try {
      conn
        .on("ready", function () {
          console.log(`### CONNECTION to ${tunnelConfig.host}: ready ###`);
          conn.shell(function (err, stream) {
            if (err) throw err;
            stream
              .on("close", function () {
                console.log(`### STREAM to ${tunnelConfig.host}: close ###`);
                conn.end();
                resolve(`### CONNECTION to ${tunnelConfig.host}: close ###`);
              })
              .on("data", function (data) {
                let dataLength = data.length;

                // enter or quit "sudo su" privillege session
                if (
                  command.indexOf("sudo su") >= 0 &&
                  data.indexOf("#") >= dataLength - 2
                ) {
                  sudosu = true;
                } else if (
                  command.indexOf("sudo su") >= 0 &&
                  data.indexOf("$") >= dataLength - 2
                ) {
                  sudosu = false;
                }

                //handle sudo password prompt
                if (
                  (command.indexOf("sudo") >= 0 &&
                    data.indexOf(`password for ${user}:`) >= 0) ||
                  data.indexOf(`password:`) >= 0
                ) {
                  console.log(`${data}${password}`);
                  stream.write(password + "\n");
                }
                // shell promt, accept a command
                else if (
                  dataLength > 2 &&
                  (data.indexOf("$") >= dataLength - 2 ||
                    data.indexOf("#") >= dataLength - 2)
                ) {
                  // commands not empty, send a command
                  if (commands.length > 0) {
                    command = commands.shift();
                    console.log(`${data}${command}`);
                    stream.write(command + "\n");
                  }
                  // commands are empty, quit session
                  else {
                    console.log(`${data}exit`);
                    // stream.write("exit\n");
                    stream.end("exit\n");
                  }
                }
                // shell output, except the command echo
                else if (data.indexOf(command) === -1) console.log(`${data}`);
              })
              .stderr.on("data", function (data) {
                console.log(
                  `### STREAM STDERR on ${tunnelConfig.host}: ${data}`
                );
                reject(data);
              });
          });
        })
        .connect(tunnelConfig);
    } catch (err) {
      reject(`### CONNECTION to ${tunnelConfig.host}: ${err}`);
    }
  });
}

module.exports = { ssh2Stream };

// usage example: upgrade OS of agroup of servers
/*
require("module-alias/register");
const { ssh2Stream } = require("@utils/taskSsh2Stream");

const commands = [
  `sudo su`,
  `yes | apt update`,
  `yes | apt upgrade`,
];

const node = "192.168.111.2";

const user = {
  username: "app-user",
  password: "********",
};

ssh2Stream(commands, host, user.username, user.password);
*/
