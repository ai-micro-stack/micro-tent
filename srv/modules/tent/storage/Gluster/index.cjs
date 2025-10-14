const fs = require("fs");
const { step0Brick } = require("./step0_brick");
const { step1Gluster } = require("./step1_gluster");
const { step2Member } = require("./step2_member");
const { step3Client } = require("./step3_client");

async function gluster(confObj) {
  await step0Brick(confObj);
  await step1Gluster(confObj);
  await step2Member(confObj);
  await step3Client(confObj);
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
  gluster(confObj);
}
