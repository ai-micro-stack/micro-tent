const { step1Swarm } = require("./step1_swarm");
const { step2Manager } = require("./step2_manager");
const { step3Worker } = require("./step3_worker");

async function swarm(confObj) {
  await step1Swarm(confObj);
  await step2Manager(confObj);
  await step3Worker(confObj);
}

exports.execute = swarm;
