const fs = require("fs");
const { step1Swarm } = require("./step1_kubernetes");
const { step2Controller } = require("./step2_controller");
const { step3Worker } = require("./step3_worker");
const { step4Storage } = require("./step4_storage");

async function kubernetes(confObj) {
  await step1Swarm(confObj);
  await step2Controller(confObj);
  await step3Worker(confObj);
  await step4Storage(confObj);
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
  kubernetes(confObj);
}
