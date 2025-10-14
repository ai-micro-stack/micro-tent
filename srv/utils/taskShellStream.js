const { spawn } = require("child_process");

function shellStream(commands) {
  const shellCmd = process.platform === "win32" ? "cmd.exe" : "/bin/bash";
  let command = "";

  const child = spawn(shellCmd, ["-i"], {
    shell: true,
    // stdio: "inherit",
  });

  child.stdout.on("data", (data) => {
    const output = data.toString();
    console.log(`${output}`);
  });

  child.stderr.on("data", (data) => {
    const output = data.toString();
    if (output.length) {
      console.error(`${output}`);
    }
  });

  child.on("close", (code) => {
    if (code !== 0) {
      console.log(`Child close: process closed with code ${code}`);
    }
  });

  // Send commands to the interactive shell
  console.log("\n========================================");
  console.log("Execute Commands:");
  console.log("----------------------------------------");
  let i = 0;
  for (i = 0; i < commands.length; i++) {
    command = commands[i];
    console.log(`${command}`);
    child.stdin.write(`${command}\n`);
  }
  console.log("----------------------------------------");
  console.log("Total commands: " + i);
  console.log("========================================\n");
  // child.stdin.write(`exit\n`); // Exit the shell
  child.stdin.end();
}

module.exports = { shellStream };

// // console.log("Spawning interactive shell...");
// const cmds = [
//   // `sudo su`,
//   `echo this is from node spawned shell`,
//   `sudo ls -la /root`,
//   `sudo cat /etc/hosts`,
// ];
// shellStream(cmds);
