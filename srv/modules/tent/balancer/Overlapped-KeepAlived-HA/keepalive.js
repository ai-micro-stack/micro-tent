const { step1KeepAlive } = require("./step1_keepalive");
const { step2Master } = require("./step2_master");
const { step3Backup } = require("./step3_backup");

async function keepalive(confObj) {
  await step1KeepAlive(confObj);
  await step2Master(confObj);
  await step3Backup(confObj);
}

exports.execute = keepalive;
