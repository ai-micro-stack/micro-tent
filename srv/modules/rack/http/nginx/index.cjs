const fs = require("fs");
// const { step1Dnamasq } = require("./step1_dnsmasq");
// const { step2Dhcp } = require("./step2_dhcp");

async function httpNginx(confObj) {
  console.log("### HTTP-NGINX ###");
  // console.log(confObj, null, 4);
  // await step1Install(confObj);
  // await step2Dhcp(confObj);
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
  httpNginx(confObj);
}
