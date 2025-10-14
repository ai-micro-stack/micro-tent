const fs = require("fs");
const { step1MicroCeph } = require("./step1_microceph");
const { step2Member } = require("./step2_member");
const { step3Disk } = require("./step3_disk");
// const { step4Gateway } = require("./step4_gateway");
const { step5Client } = require("./step5_client");

async function microceph(confObj) {
  await step1MicroCeph(confObj);
  await step2Member(confObj);
  await step3Disk(confObj);
  // await step4Gateway(confObj);
  await step5Client(confObj);
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
  microceph(confObj);
}
