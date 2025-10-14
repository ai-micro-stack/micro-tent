const fs = require("fs");
const path = require("path");
const { step1Install } = require("./step1_install");
const { step2Config } = require("./step2_config");

async function ConfigDnsmasq(confObj, sections, replacements) {
  console.log(`### dnsmasq sections: ${sections.join(",")} ###`);
  // console.log(confObj, null, 4);
  await step1Install(confObj);
  await step2Config(confObj, sections, replacements);
}

console.log("### MODULE_NAME: DHCP ###");
const sections = ["nic", "dhcp", "boot"];
const replacements = sections.map((section) => {
  const repPath = path.join(
    __dirname, // currnt module location
    `./dnsmasq.${section.toLowerCase()}.conf`
  );
  console.log(repPath);
  return fs.readFileSync(repPath, "utf8");
});

if (process.argv.length < 3) {
  console.log("Missing conf file argument. Quit task process ...");
} else {
  const confObjPath = process.argv[2];
  const confObject = fs.readFileSync(confObjPath, "utf8");
  const confObj = JSON.parse(confObject);
  ConfigDnsmasq(confObj, sections, replacements);
}
