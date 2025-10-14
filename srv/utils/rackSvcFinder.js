require("module-alias/register");
const { execSync } = require("child_process");
// const { ssh2Promise } = require("@utils/taskSsh2Promise");
const { exec } = require("child_process");

async function serviceCheck(protocol, port, user, provider, pxeroot) {
  return new Promise((resolve, reject) => {
    try {
      let cmd = "";
      switch (process.platform) {
        case "win32":
          cmd = `tasklist.exe /svc /NH /FO CSV`;
          const processList = execSync(cmd).toString();
          const serviceList = processList
            .toLowerCase()
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => {
              return line.length > 0;
            })
            .map((line) => {
              let parts = [];
              let srvic = {};
              parts = line.split(",").map((x) => x.replace(/^"|.exe|"$/g, ""));
              srvic = {
                proc: parts[0] === "svchost.exe" ? parts[2] : parts[0],
                state: "+",
              };
              return srvic;
            });
          resolve(serviceList.find((y) => y.proc === provider)?.state ?? "");
          break;
        case "linux":
          cmd =
            provider !== "ipxe"
              ? `sudo lsof -i${protocol}:${port} | grep "${provider}"`
              : `sudo ls -la ${pxeroot}/ipxe-bin/ipxe.*`;
          // cmd =
          //   provider !== "ipxe"
          //     ? `echo -e ${user.password} | sudo -S lsof -i${protocol}:${port} | grep ${provider}`
          //     : `echo -e ${user.password} | sudo -S ls -la ${pxeroot}/ipxe-bin/ipxe.*`;
          exec(cmd, (error, stdout, stderr) => {
            if (error) {
              // console.error(error);
              resolve();
            }
            // console.log(`stdout: ${stdout}`);
            // console.error(`stderr: ${stderr}`);
            const detaill = stdout
              .toString()
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter((line) => {
                return line.length > 0;
              });
            resolve(detaill.join());
          });
          /*
          ssh2Promise(
            cmd,
            "127.0.0.1", //peer
            user.username,
            user.password
          ).then((result) => {
            const detaill = result
              .toString()
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter((line) => {
                return line.length > 0;
              });
            resolve(detaill.join());
          });
          */
          break;
        default:
          resolve();
      }
    } catch (err) {
      console.log(err);
      reject();
      // resolve();
    }
  });
}

module.exports = { serviceCheck };
