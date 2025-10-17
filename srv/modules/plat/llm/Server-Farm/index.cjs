require("module-alias/register");
const fs = require("fs");
const path = require('path');
const { step1Ollma } = require("./step1_ollama");
const { step2Service } = require("./step2_service");
//
const { pull_Gemma3_270m } = require("./pull_gemma3_270m");
// const { pull_GPT_4o } = require("./pull_gpt_4o");
// const { pull_DeepSeek } = require("./pull_deepseek");
// const { pull_Qwen } = require("./pull_qwen");
// const { pull_Grok } = require("./pull_grok");
// const { pull_Llama3 } = require("./pull_llama3");
// const { pull_Claude } = require("./pull_claude");
// const { pull_Mistral } = require("./pull_mistral");
// const { pull_Memini } = require("./pull_memini");
// const { pull_Command_R } = require("./pull_command_r");

async function ModuleHandler(confObj, taskDetails, trackerPath) {
  // console.log(confObj, null, 4);
  const serviceAccount = confObj.serviceAccount;
  const members = confObj.llm.members;
  // const clusters = confObj.resource.clusters;
  const modelServer = confObj.llm.model_server;

  function getTaskTracker(trackerPath) {
    let taskTracker = {ollama: 0};
    try {
      const trackerText = fs.readFileSync(trackerPath, "utf8");
      taskTracker = JSON.parse(trackerText);
    } catch {
      console.log("Task tracker is not available. Run this task ...")
      fs.writeFileSync(trackerPath, JSON.stringify(taskTracker));
    }
    return taskTracker;
  }

  let cluster = members.find((m) => m.hci_id === taskDetails.hci_id);
  if (!cluster) {
    console.log("Can't find the target cluster.");
    return;
  }

  if (taskDetails.target === "server" && modelServer !== "(None)") {
    console.log(
      `With ${cluster.hci_name}, it calls installing server: ${modelServer}`
    );
    switch (modelServer.toLowerCase()) {
      case "ollama":
        const taskTracker = getTaskTracker(trackerPath)
        if (Date.now() - taskTracker.ollama > 86400000) {
          await step1Ollma(cluster, serviceAccount);
          await step2Service(cluster, serviceAccount);
          taskTracker.ollama = Date.now();
          fs.writeFileSync(trackerPath, JSON.stringify(taskTracker));
        }
        else console.log("Ollama is installed not long. Remove the task tracker to force redo.");
        break;
      default:
        console.log("Unsuppoted model server ...");
        break;
    }
  }

  console.log(
    `With ${cluster.hci_name}, it calls pulling llmodel: ${cluster.llm_model_name}`
  );
  switch (cluster.llm_model_name) {
    case "gemma3:270m":
      await pull_Gemma3_270m(cluster, serviceAccount);
      break;
    //   case "GPT-4o":
    //     await pull_GPT_4o(cluster, serviceAccount);
    //     break;
    //   case "DeepSeek":
    //     await pull_DeepSeek(cluster, serviceAccount);
    //     break;
    //   case "Qwen":
    //     await pull_Qwen(cluster, serviceAccount);
    //     break;
    //   case "Grok":
    //     await pull_Grok(cluster, serviceAccount);
    //     break;
    //   case "Llama3":
    //     await pull_Llama3(cluster, serviceAccount);
    //     break;
    //   case "Claude":
    //     await pull_Claude(cluster, serviceAccount);
    //     break;
    //   case "Mistral":
    //     await pull_Mistral(cluster, serviceAccount);
    //     break;
    //   case "Memini":
    //     await pull_Memini(cluster, serviceAccount);
    //     break;
    //   case "Command R":
    //     await pull_Command_R(cluster, serviceAccount);
    //     break;
    default:
      console.log("Not supported llmodel: " + cluster.llm_model_name);
      break;
  }
}

if (process.argv.length < 4) {
  console.log("Missing conf file argument. Quit task process ...");
} else {
  const confObjPath = process.argv[2];
  const taskDetails = JSON.parse(process.argv[3]);
  const trackerPath = path.join(path.dirname(confObjPath),"taskTracker.json");
  const confObject = fs.readFileSync(confObjPath, "utf8");
  const confObj = JSON.parse(confObject);
  ModuleHandler(confObj, taskDetails, trackerPath);
}
