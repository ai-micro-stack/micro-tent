const fs = require("fs");
const { step0Member } = require("./step0_member");
const { step1Portainer } = require("./step1_portainer");

async function portainer(confObj, area) {
  await step0Member(confObj, area);
  await step1Portainer(confObj, area);
}

// const path = reqire("path");
// const confObjPath = path.join(
//   __dirname, // currnt module location
//   "../", // module type location
//   "../", // modules/tent
//   "config/", // config file location
//   `confObj_.object`
// );

if (process.argv.length < 4) {
  console.log("Missing conf file argument. Quit task process ...");
} else {
  const supportClusters = ["Swarm", "Kubernetes"];
  const confObjPath = process.argv[2];
  const area = process.argv[3];

  const confObject = fs.readFileSync(confObjPath, "utf8");
  const confObj = JSON.parse(confObject);
  const clusterType = confObj[area].type;
  if (!supportClusters.includes(clusterType)) {
    console.log(
      "Current module does not support cluster type of " + clusterType
    );
  } else {
    portainer(confObj, area);
  }
}
