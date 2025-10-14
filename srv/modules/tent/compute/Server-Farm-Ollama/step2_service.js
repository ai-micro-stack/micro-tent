require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step2Service(confObj) {
  const user = confObj.serviceAccount;
  const nodes = confObj.compute.nodes;
  const spares = confObj.compute.spares ?? [];
  // const members = confObj.balancer.members;
  const storage_share = confObj.storage.global_share;

  if (!nodes.length) return;

  // let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  const modelStoreConf = `# Environment="OLLAMA_MODELS=$storage_share/ollama_models"`;
  const ServiceConf = `# Ollama service
[Unit]
Description=Ollama Service 
After=network-online.target

[Service]
Environment="OLLAMA_HOST=0.0.0.0"
$modelStoreConf
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
`;

  let ollamaService = "";
  ollamaService += ServiceConf.replaceAll("$modelStoreConf", modelStoreConf);
  ollamaService = ollamaService.replace(/\n/g, "\\n");

  const cmds_all = [
    `echo $sudopw | sudo -S mkdir -pv $storage_share/ollama_models`,
    `echo $sudopw | sudo -S chmod 777 $storage_share/ollama_models`,
    "echo $sudopw | sudo -S useradd -r -s /bin/false -U -m -d /usr/share/ollama ollama",
    "echo $sudopw | sudo -S usermod -a -G ollama $(whoami)",
    `echo -e "$ollamaService" > ~/ollama.service`,
    `echo $sudopw | sudo -S mv -f ~/ollama.service /etc/systemd/system/ollama.service`,
    `echo $sudopw | sudo -S chown root:root /etc/systemd/system/ollama.service`,
    `echo $sudopw | sudo -S chmod 755 /etc/systemd/system/ollama.service`,
    "echo $sudopw | sudo -S sudo systemctl daemon-reload",
    "sleep 10",
    "echo $sudopw | sudo -S systemctl restart ollama",
    "echo $sudopw | sudo -S systemctl enable ollama",
  ];

  cmds = cmds_all
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (spares.includes(node)) return;
    // if (members.includes(node)) continue;
    console.log("###############################################");
    console.log("## ssh2 session with: " + node);
    console.log("###############################################");
    for (let j = 0; j < cmds.length; j++) {
      cmd = cmds[j]
        .replaceAll("$nodeip", node)
        .replaceAll("$user", user.username)
        .replaceAll("$sudopw", user.password)
        .replaceAll("$storage_share", storage_share)
        .replaceAll("$ollamaService", ollamaService)
        .replaceAll("$linkup", linkup);
      console.log("### COMMAND: " + cmd);
      linkup = await ssh2Promise(
        cmd,
        node, //peer
        user.username,
        user.password
      );
      console.log("### COMPLETE: " + linkup);
      console.log();
    }
  }
}

module.exports = { step2Service };
