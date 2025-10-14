const fs = require("fs");
const { step1KeepAlive } = require("./step1_keepalive");
const { step2Master } = require("./step2_master");
const { step3Backup } = require("./step3_backup");
const { step4Worker } = require("./step4_worker");

async function keepalive(confObj) {
  await step1KeepAlive(confObj);
  await step2Master(confObj);
  await step3Backup(confObj);
  await step4Worker(confObj);
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
  keepalive(confObj);
}
