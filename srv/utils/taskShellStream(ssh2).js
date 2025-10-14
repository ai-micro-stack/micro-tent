const { spawn } = require("child_process");

function shellStream(commands, password = "") {
  const shellCmd = process.platform === "win32" ? "cmd.exe" : "/bin/bash";

  return new Promise((resolve, reject) => {
    let allData = "";

    // try {
    const child = spawn(shellCmd, [], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (data) => {
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
        child.stdin.write(password + "\n");
        // stdin.write(password + "\n");
      }
      // childShell promt, accept a command
      else if (
        dataLength > 2 &&
        (data.indexOf("$") >= dataLength - 2 ||
          data.indexOf("#") >= dataLength - 2)
      ) {
        // commands not empty, send a command
        if (commands.length > 0) {
          command = commands.shift();
          console.log(`${data}${command}`);
          child.stdin.write(command + "\n");
          // stdin.write(command + "\n");
        }
        // commands are empty, quit session
        else {
          console.log(`${data}exit`);
          // child.stdin.write("exit\n");
          child.stdin.end();
          // stdin.end("exit\n");
        }
      }
      // childShell output, except the command echo
      else if (data.indexOf(command) === -1) console.log(`${data}`);
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (err) => {
      console.error(`stderr: ${err}`);
      reject(err);
    });

    child.on("close", (code) => {
      console.log(`childShell process is closed with code ${code}`);
      resolve({ code, result: allData });
    });

    child.on("exit", (code, signal) => {
      console.log(`childShell process is exited with code ${code}`);
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
