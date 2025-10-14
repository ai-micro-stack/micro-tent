const { step0Member } = require("./step0_member");
const { step1Portainer } = require("./step1_portainer");

async function portainer(confObj) {
  await step0Member(confObj);
  await step1Portainer(confObj);
}

exports.execute = portainer;
