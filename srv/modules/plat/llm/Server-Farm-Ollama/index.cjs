const fs = require("fs");
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

async function swarm(confObj) {
  console.log(confObj, null, 4);
  const vectordbs = confObj.llm.members;
  for (member in vectordbs) {
    console.log(
      "With ${member.hci_name}, it calls pulling llmodel: ${member.llm_model_name}"
    );
    switch (member.llm_model_name) {
      case "gemma3:270m":
        await pull_Gemma3_270m(confObj);
        break;
      //   case "GPT-4o":
      //     await pull_GPT_4o(confObj);
      //     break;
      //   case "DeepSeek":
      //     await pull_DeepSeek(confObj);
      //     break;
      //   case "Qwen":
      //     await pull_Qwen(confObj);
      //     break;
      //   case "Grok":
      //     await pull_Grok(confObj);
      //     break;
      //   case "Llama3":
      //     await pull_Llama3(confObj);
      //     break;
      //   case "Claude":
      //     await pull_Claude(confObj);
      //     break;
      //   case "Mistral":
      //     await pull_Mistral(confObj);
      //     break;
      //   case "Memini":
      //     await pull_Memini(confObj);
      //     break;
      //   case "Command R":
      //     await pull_Command_R(confObj);
      //     break;
      default:
        console.log("Not supported llmodel: " + member.llm_model_name);
        break;
    }
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
