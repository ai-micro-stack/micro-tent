const { step1Ollma } = require("./step1_ollama");
const { step2Service } = require("./step2_service");
// const { step3Worker } = require("./step3_worker");

async function ollama(confObj) {
  await step1Ollma(confObj);
  await step2Service(confObj);
  // await step3Worker(confObj);
}

exports.execute = ollama;
