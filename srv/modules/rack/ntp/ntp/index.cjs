const fs = require("fs");
const { step1Install } = require("./step1_install");
const { step2Config } = require("./step2_config");

async function ntpNtp(confObj) {
  console.log("### NTP-NTP ###");
  // console.log(confObj, null, 4);
  await step1Install(confObj);
  await step2Config(confObj);
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
  ntpNtp(confObj);
}
