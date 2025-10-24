require("module-alias/register");
const fs = require("fs");
const path = require('path');
const { step1Ollma } = require("@modules/plat/llm/Server-Farm/step1_ollama");
const { step2Service } = require("@modules/plat/llm/Server-Farm/step2_service");
//
const { pull_all_MiniLM_L6_v2 } = require("./pull_all_minilm_l6_v2");
// const { pull_nomic_embed_text } = require("./pull_nomic_embed_text");
// const { pull_mxbai_embed_large } = require("./pull_mxbai_embed_large");
// const { pull_bge_m3 } = require("./pull_bge_m3");

async function ModuleHandler(confObj, taskDetails, trackerPath) {
  // console.log(confObj, null, 4);
  const serviceAccount = confObj.serviceAccount;
  const members = confObj.embedding.members;
  const clusters = confObj.resource.clusters;
  const modelServer = confObj.embedding.model_server;

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

  let member = members.find((m) => m.hci_id === taskDetails.hci_id);
  if (!member) {
    console.log("Can't find the target cluster.");
    return;
  }
  let resource = clusters.find((m) => m.hci_id === taskDetails.hci_id);
  cluster = {
    ...member, 
    storage_share: resource.storage.storage_cluster_share
  };

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
    `With ${cluster.hci_name}, it calls pulling llmodel: ${cluster.embedding_model_name}`
  );
  switch (cluster.embedding_model_name) {
    case "all-MiniLM-L6-v2":
      await pull_all_MiniLM_L6_v2(cluster, serviceAccount);
      break;
    // case "nomic-embed-text":
    //   await pull_nomic_embed_text(cluster, serviceAccount);
    //   break;
    // case "mxbai-embed-large":
    //   await pull_mxbai_embed_large(cluster, serviceAccount);
    //   break;
    // case "bge-m3":
    //   await pull_bge_m3(cluster, serviceAccount);
    //   break;
    default:
      console.log("Not supported emded_model: " + cluster.embedding_model_name);
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
