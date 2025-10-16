require("module-alias/register");
const fs = require("fs");
// const { pull_nomic_embed_text } = require("./pull_nomic_embed_text");
// const { pull_mxbai_embed_large } = require("./pull_mxbai_embed_large");
// const { pull_bge_m3 } = require("./pull_bge_m3");

async function ModuleHandler(confObj, taskDetails) {
  // console.log(confObj, null, 4);
  const serviceAccount = confObj.serviceAccount;
  const members = confObj.embedding.members;
  // const clusters = confObj.resource.clusters;
  const modelServer = confObj.embedding.model_server;

  let cluster = members.find((m) => m.hci_id === taskDetails.hci_id);
  if (!cluster) {
    console.log("Can't find the target cluster.");
    return;
  }

  if (taskDetails.target === "server" && modelServer !== "(None)") {
    console.log(
      `With ${cluster.hci_name}, it calls installing server: ${modelServer}`
    );
  }

  console.log(
    `With ${cluster.hci_name}, it calls pulling emded_model: ${cluster.embedding_model_name}`
  );
  // switch (cluster.embedding_model_name) {
  //   case "nomic-embed-text":
  //     await pull_nomic_embed_text(cluster, serviceAccount);
  //     break;
  //   case "mxbai-embed-large":
  //     await pull_mxbai_embed_large(cluster, serviceAccount);
  //     break;
  //   case "bge-m3":
  //     await pull_bge_m3(cluster, serviceAccount);
  //     break;
  //   default:
  //     console.log(
  //       "Not supported emded_model: " + cluster.embedding_model_name
  //     );
  //     break;
  // }
}

if (process.argv.length < 4) {
  console.log("Missing conf file argument. Quit task process ...");
} else {
  const confObjPath = process.argv[2];
  const taskDetails = JSON.parse(process.argv[3]);
  const confObject = fs.readFileSync(confObjPath, "utf8");
  const confObj = JSON.parse(confObject);
  ModuleHandler(confObj, taskDetails);
}
