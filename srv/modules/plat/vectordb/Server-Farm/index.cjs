require("module-alias/register");
const fs = require("fs");
// const { step1SetupFastApiServer } = require("./step1_fastapi_server");
// const { step2SetupServerService } = require("./step2_server_service");
//
// const { pull_Chroma } = require("./pull_chroma");
// const { pull_Faiss } = require("./pull_faiss");
// const { pull_Milvus } = require("./pull_milvus");
// const { pull_Qdrant } = require("./pull_qdrant");
// const { pull_Weaviatet } = require("./pull_weaviate");
// const { pull_PgVector } = require("./pull_pgvector");

async function ModuleHandler(confObj, taskDetails) {
  // console.log(confObj, null, 4);
  const serviceAccount = confObj.serviceAccount;
  // const clusters = confObj.resource.clusters;
  const members = confObj.vectordb.members;
  const modelServer = confObj.vectordb.model_server;

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
      case "fastapi":
        // await step1SetupFastApiServer(cluster, serviceAccount);
        // await step2SetupServerService(cluster, serviceAccount);
        break;
      default:
        console.log("Unsuppoted model server ...");
        break;
    }
  }

  console.log(
    `With ${cluster.hci_name}, it calls pulling vectordb: ${cluster.vectordb_vendor_name}`
  );
  // switch (cluster.vectordb_vendor_name) {
  //   case "Chroma":
  //     await pull_Chroma(cluster, serviceAccount);
  //     break;
  //   case "Faiss":
  //     await pull_Faiss(cluster, serviceAccount);
  //     break;
  //   case "Milvus":
  //     await pull_Milvus(cluster, serviceAccount);
  //     break;
  //   case "Qdrant":
  //     await pull_Qdrant(cluster, serviceAccount);
  //     break;
  //   case "Weaviatet":
  //     await pull_Weaviatet(cluster, serviceAccount);
  //     break;
  //   case "pgvector":
  //     await pull_PgVector(cluster, serviceAccount);
  //     break;
  //   default:
  //     console.log("Not supported vectordb: " + cluster.vectordb_vendor_name);
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
