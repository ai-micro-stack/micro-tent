require("module-alias/register");
const { ssh2Stream } = require("@utils/taskSsh2Stream");

async function pull_all_MiniLM_L6_v2(cluster, serviceAccount) {
  const user = serviceAccount;
  const nodes = cluster.nodes.map((n) => n.ip);
  const spares = cluster.spares ?? [];

  if (!nodes.length) return;

  const embedding_model_name = cluster.embedding_model_name;

  let node = "";
  let cmds = [];
  // let cmd = "";
  // let linkup = "";
  let result = "";

  const cmds_inst = [`ollama pull ${embedding_model_name}`];

  cmds = cmds_inst
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  for (let idx in nodes) {
    node = nodes[idx];
    if (spares.includes(node)) return;
    console.log("###############################################");
    console.log("## ssh2 session with: " + node);
    console.log("###############################################");
    result = await ssh2Stream(cmds, node, user.username, user.password);
    console.log();
  }
}

module.exports = { pull_all_MiniLM_L6_v2 };
