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

exports.execute = microceph;
