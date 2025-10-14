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

exports.execute = gluster;
