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

exports.execute = kubernetes;
