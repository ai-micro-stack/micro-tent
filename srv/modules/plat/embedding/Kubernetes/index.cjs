const fs = require("fs");
// const { pull_nomic_embed_text } = require("./pull_nomic_embed_text");
// const { pull_mxbai_embed_large } = require("./pull_mxbai_embed_large");
// const { pull_bge_m3 } = require("./pull_bge_m3");

async function swarm(confObj) {
  console.log(confObj, null, 4);
  const vectordbs = confObj.embedding.members;
  for (member in vectordbs) {
    console.log(
      "With ${member.hci_name}, it calls pulling emded_model: ${member.embedding_model_name}"
    );
    // switch (member.embedding_model_name) {
    //   case "nomic-embed-text":
    //     await pull_nomic_embed_text(confObj);
    //     break;
    //   case "mxbai-embed-large":
    //     await pull_mxbai_embed_large(confObj);
    //     break;
    //   case "bge-m3":
    //     await pull_bge_m3(confObj);
    //     break;
    //   default:
    //     console.log(
    //       "Not supported emded_model: " + member.embedding_model_name
    //     );
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
