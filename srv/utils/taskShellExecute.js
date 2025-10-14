const { exec } = require("child_process");

function shellStream(commands, password = "") {
  const shellCmd = process.platform === "win32" ? "cmd.exe" : "/bin/bash";
  return new Promise((resolve, reject) => {
    let allData = "";
    // try {
    const shell = exec(shellCmd);

    // shell.stdout.setEncoding("utf8");
    shell.stdout.on("data", (data) => {
      // shell.on("data", (data) => {
      console.log(data);

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
        shell.stdin.write(password + "\n");
        // stdin.write(password + "\n");
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
          shell.stdin.write(command + "\n");
          // stdin.write(command + "\n");
        }
        // commands are empty, quit session
        else {
          console.log(`${data}exit`);
          // shell.stdin.write("exit\n");
          shell.stdin.end("exit\n");
          // stdin.end("exit\n");
        }
      }
      // shell output, except the command echo
      else if (data.indexOf(command) === -1) console.log(`${data}`);
    });

    // shell.error.setEncoding("utf8");
    shell.stderr.on("data", (err) => {
      // shell.on("error", (err) => {
      console.error(`stderr: ${err}`);
      reject(err);
    });

    shell.on("close", (code) => {
      console.log(`shell process close with code ${code}`);
      resolve({ code, result: allData });
    });

    shell.on("exit", (code, signal) => {
      console.log(`shell process exited with code ${code}`);
      resolve({ code, result: allData });
    });
    // } catch (err) {
    //   reject(err);
    // }
  });
}

module.exports = { shellStream };

// usage example: upgrade OS of the host
/*
require("module-alias/register");
const { shellStream } = require("@utils/taskShellStream");

const cmds = [
  `sudo su`,
  `yes | apt update`,
  `yes | apt upgrade`,
];

shellStream(cmds);
*/
