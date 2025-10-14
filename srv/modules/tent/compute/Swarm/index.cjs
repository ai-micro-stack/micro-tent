const fs = require("fs");
const { step1Swarm } = require("./step1_swarm");
const { step2Manager } = require("./step2_manager");
const { step3Worker } = require("./step3_worker");

async function swarm(confObj) {
  await step1Swarm(confObj);
  await step2Manager(confObj);
  await step3Worker(confObj);
}

// const path = reqire("path");
// const confObjPath = path.join(
//   __dirname, // currnt module location
//   "../", // module type location
//   "../", // modules/tent
//   "config/", // config file location
//   `confObj_.object`
// );

if (process.argv.length < 3) {
  console.log("Missing conf file argument. Quit task process ...");
} else {
  const confObjPath = process.argv[2];

  const confObject = fs.readFileSync(confObjPath, "utf8");
  const confObj = JSON.parse(confObject);
  swarm(confObj);
}
