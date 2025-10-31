require("module-alias/register");
const fs = require("fs");
const path = require("path");
const { ssh2Stream } = require("@utils/taskSsh2Stream");

async function pxeIpxe(confObj) {
  console.log("### PXE-IPXE ###");
  // console.log(confObj, null, 4);
  const user = confObj.serviceAccount;
  const nodes = ["127.0.0.1"];
  const pxeDependencis = confObj.pxe_dependency.join(" ");

  // const rackDir = "./modules/rack";
  const rackDir = path.join(
    __dirname, // currnt module location
    "../", // module type location
    "../" // modules/rack
  );

  const setupDir = `${rackDir}/pxe/ipxe/`;

  // process a task in user's task queue
  try {
    const cmds_all = [
      // `sudo su`,
      `sudo apt install ${pxeDependencis} -y`,
      `pushd ${setupDir}`,
      `./1-pxe-boot-server.sh`,
      `popd`,
    ];

    let cmds = [];
    cmds = cmds_all
      .map((cmd) => {
        return cmd.split("#")[0];
      })
      .filter((cmd) => {
        return cmd.length > 0;
      });

    let node = "";
    for (let idx in nodes) {
      node = nodes[idx];
      console.log("###############################################");
      console.log("## shell stream with:: " + node);
      console.log("###############################################");
      result = await ssh2Stream(cmds, node, user.username, user.password);
      console.log();
    }
  } catch (err) {
    console.log(err);
  }
}

if (process.argv.length < 3) {
  console.log("Missing conf file argument. Quit task process ...");
} else {
  const confObjPath = process.argv[2];

  const confObject = fs.readFileSync(confObjPath, "utf8");
  const confObj = JSON.parse(confObject);
  pxeIpxe(confObj);
}
