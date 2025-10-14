require("module-alias/register");
// const { ssh2Stream } = require("@utils/taskSsh2Stream");
const { shellStream } = require("@utils/taskShellStream");

async function step2Config(confObj) {
  const user = confObj.serviceAccount;
  const nodes = ["127.0.0.1"];

  const cmds_all = [
    `sudo su`,
    `pushd /etc`,
    `sudo [ -f exports.backup ] || sudo mv -v exports exports.backup`,
    `sudo bash -c "cat << EOF > /etc/exports
    /pxeboot           *(ro,sync,no_wdelay,insecure_locks,no_root_squash,insecure,no_subtree_check)
EOF"`,
    `popd`,
    `sudo exportfs -av`,
    `exit`,
  ];

  let cmds = [];
  cmds = cmds_all
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  let node = "";
  for (let idx in nodes) {
    node = nodes[idx];
    console.log("###############################################");
    console.log("## shell stream with: " + node);
    console.log("###############################################");
    // result = await ssh2Stream(cmds, node, user.username, user.password);
    result = await shellStream(cmds);
    console.log();
  }
}

module.exports = { step2Config };
