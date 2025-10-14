const express = require("express");
const cors = require("cors");
const os = require("os");
const { readFileSync } = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const authLoginRouter = require("./routes/authlogin");
const authTeamRouter = require("./routes/authteam");
// const rackPxeRouter = require("./routes/rackpxe");
const rackPlanRouter = require("./routes/rackplan");
const rackBuildRouter = require("./routes/rackbuild");
const rackServiceRouter = require("./routes/rackservice");
const rackContextRouter = require("./routes/rackcontext");
const rackImageRouter = require("./routes/rackimage");
const rackStaticRouter = require("./routes/rackstatic");
const stackUploadRouter = require("./routes/stackupload");
const stackPluginRouter = require("./routes/stackplugin");
const tentResourceRouter = require("./routes/tentresource");
const tentPlanRouter = require("./routes/tentplan");
const tentBuildRouter = require("./routes/tentbuild");
const platPlanRouter = require("./routes/platplan");
const platBuildRouter = require("./routes/platbuild");
const { socketServer } = require("./utils/taskSocketServer");
const { ClearTasks } = require("./utils/taskQueue");

// environment variables
const environment = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
dotenv.config({ path: `.env.${environment}` });
const {
  BACKEND_SERVER,
  BACKEND_PORT,
  DEFAULT_STACK,
  // CLUSTER_USER,
  // CLUSTER_PASS,
} = process.env;
// ssh2 target server
const ssh2Config = {
  host: `${BACKEND_SERVER}`,
  port: 22,
  // username: `${CLUSTER_USER}`,
  // password: `${CLUSTER_PASS}`,
  username: process.env.USER ?? process.env.USERNAME,
  privateKey: readFileSync(os.homedir() + "/.ssh/id_rsa_stack"),
};

// route controls
const gui = "../gui";
const rack = gui + "/rack/dist";
const tent = gui + "/tent/dist";
const plat = gui + "/plat/dist";
const ipv4 = gui + `/${DEFAULT_STACK.toLowerCase()}/dist`;
const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

// express app
const app = express();
const rackHandler = express.static(path.join(__dirname, rack));
const tentHandler = express.static(path.join(__dirname, tent));
const platHandler = express.static(path.join(__dirname, plat));
const ipv4Handler = express.static(path.join(__dirname, ipv4));
const p404Handler = (req, res, next) => {
  res.status(404).json({ message: "Sorry, can't find that!" });
};

// origin control setting
app.use(express.json());
app.use(cors({ origin: "*" }));

// routes setup
app.use("/authlogin", authLoginRouter);
app.use("/authteam", authTeamRouter);
// app.use("/rackpxe", rackPxeRouter);
app.use("/rackplan", rackPlanRouter);
app.use("/rackbuild", rackBuildRouter);
app.use("/rackservice", rackServiceRouter);
app.use("/rackcontext", rackContextRouter);
app.use("/rackimage", rackImageRouter);
app.use("/rackstatic", rackStaticRouter);
app.use("/stackupload", stackUploadRouter);
app.use("/stackplugin", stackPluginRouter);
app.use("/tentresource", tentResourceRouter);
app.use("/tentplan", tentPlanRouter);
app.use("/tentbuild", tentBuildRouter);
app.use("/platplan", platPlanRouter);
app.use("/platbuild", platBuildRouter);

// handle initial browse request
app.use("/", (req, res, next) => {
  const origin = req.get("host");
  const host = origin.split(":")[0];
  if (host.indexOf("rack.") === 0) {
    rackHandler(req, res, next);
  } else if (host.indexOf("tent.") === 0) {
    tentHandler(req, res, next);
  } else if (host.indexOf("plat.") === 0) {
    platHandler(req, res, next);
  } else if (ipv4Regex.test(host) || ipv6Regex.test(host)) {
    ipv4Handler(req, res, next);
  } else {
    p404Handler(req, res, next);
  }
});

// handle page refresh request
app.get("*", (req, res) => {
  const origin = req.get("host");
  const host = origin.split(":")[0];
  const options = { root: tent };
  if (host.indexOf("rack.") === 0) {
    options.root = rack;
  } else if (host.indexOf("tent.") === 0) {
    options.root = tent;
  } else if (host.indexOf("plat.") === 0) {
    options.root = plat;
  } else if (ipv4Regex.test(host) || ipv6Regex.test(host)) {
    options.root = ipv4;
  } else res.status(404).json({ message: "Oops! Page not found." }).end();
  res.sendFile("index.html", options);
});

// unhandled post request
app.post("/", function (req, res) {
  res.send("Got a POST request");
});

// Start the service at the configured port
const PORT = BACKEND_PORT || 3002;
const httpServer = app.listen(PORT, () => {
  console.log(`Server listening at http://${BACKEND_SERVER}:${PORT}`);
  // create socket server
  socketServer(httpServer, ssh2Config);
  ClearTasks();
});
