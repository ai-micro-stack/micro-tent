const fs = require("fs");
// const { pull_Milvus } = require("./pull_milvus");
// const { pull_Qdrant } = require("./pull_qdrant");
// const { pull_Weaviatet } = require("./pull_weaviate");

async function swarm(confObj) {
  console.log(confObj, null, 4);
  const vectordbs = confObj.vectordb.members;
  for (member in vectordbs) {
    console.log(
      "With ${member.hci_name}, it calls pulling vectordb: ${member.vectordb_vendor_name}"
    );
    // switch (member.vectordb_vendor_name) {
    //   case "Milvus":
    //     await pull_Milvus(confObj);
    //     break;
    //   case "Qdrant":
    //     await pull_Qdrant(confObj);
    //     break;
    //   case "Weaviatet":
    //     await pull_Weaviatet(confObj);
    //     break;
    //   default:
    //     console.log("Not supported vectordb: " + member.vectordb_vendor_name);
    //     break;
    // }
  }
}

if (process.argv.length < 3) {
  console.log("Missing conf file argument. Quit task process ...");
} else {
  const confObjPath = process.argv[2];
  const confObject = fs.readFileSync(confObjPath, "utf8");
  const confObj = JSON.parse(confObject);
  swarm(confObj);
}
