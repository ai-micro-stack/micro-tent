const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { populateStaticData } = require("@utils/rackStaticParser");

const platDir = "./modules/plat";
const tentDir = "./modules/tent";
const rackDir = "./modules/rack";
const confDir = `${rackDir}/config`;
const setupDir = `${rackDir}/pxe/ipxe`;
const ConfFile = `${confDir}/pxe-server.conf`;

const pxeBootRoot = fs
  .readFileSync(`${ConfFile}`, "utf8")
  .split(/\r?\n/)
  .map((line) => {
    return line.split("#")[0].trim();
  })
  .filter((line) => {
    return line.length && line.startsWith("pxeRoot=");
  })
  .map((line) => {
    return line.split("=")[1].replace(/^"|"$/g, "");
  });

const pxeRoot = pxeBootRoot[0] ? pxeBootRoot[0] : "/pxeboot";
const isoStore = `${pxeRoot}/os-store/`;
const plgStore = `${setupDir}/plugin/`;
const cfgStore = `${rackDir}/config/`;
const rackStore = `${rackDir}/config/`;
const tenttore = `${tentDir}/config/`;
const platStore = `${platDir}/config/`;

const channelToFileStore = {
  isoUpload: isoStore,
  plgUpload: plgStore,
  cfgUpload: cfgStore,
  rackPlugin: rackStore,
  tentPlugin: tenttore,
  platPlugin: platStore,
};

// The uploads in progress
let uploads = {};

router.get("/files/:channel", (req, res) => {
  const fileStore = channelToFileStore[req.params.channel];

  const files = fs.readdirSync(fileStore).filter((item) => {
    const itemPath = `${fileStore}${item}`;
    return fs.statSync(itemPath).isFile();
  });

  res.send(files);
});

router.post("/file/:channel", (req, res) => {
  const fileStore = channelToFileStore[req.params.channel];
  const uniqueFileId = String(req.headers["x-file-name"]);
  const match = req.headers["content-range"].match(/(\d+)-(\d+)\/(\d+)/);
  const start = parseInt(match[1]);
  const fileSize = parseInt(String(req.headers["file-size"]), 10);

  if (!fs.existsSync(fileStore)) {
    fs.mkdirSync(fileStore);
  }

  if (
    uploads[uniqueFileId] &&
    fileSize === uploads[uniqueFileId].bytesReceived
  ) {
    res.status(200).send("File already uploaded");
    res.end();
    return;
  }

  if (!uniqueFileId) {
    res.status(400).send("No x-file-name header found");
    res.end(400);
    return;
  }

  if (!uploads[uniqueFileId]) uploads[uniqueFileId] = {};
  const upload = uploads[uniqueFileId];

  let fileStream;

  if (!start) {
    upload.bytesReceived = 0;
    fileStream = fs.createWriteStream(`${fileStore}${uniqueFileId}`, {
      flags: "w",
    });
  } else {
    if (upload.bytesReceived != start) {
      res.writeHead(400, "Wrong start byte");
      res.end(upload.bytesReceived);
      return;
    }
    // append to existing file
    fileStream = fs.createWriteStream(`${fileStore}${uniqueFileId}`, {
      flags: "a",
    });
  }

  req.on("data", function (data) {
    upload.bytesReceived += data.length;
  });

  req.pipe(fileStream);

  // when the request is finished, and all its data is written
  fileStream.on("close", function () {
    res.status(201).send({ status: "UPLOAD_COMPLETE" });
  });

  // in case of I/O error - finish the request
  fileStream.on("error", function (_err) {
    res.status(500).send("File error");
    res.end();
  });
});

router.get("/status/:channel", (req, res) => {
  const fileStore = channelToFileStore[req.params.channel];
  const uniqueFileId = String(req.headers["x-file-name"]);
  const fileSize = parseInt(String(req.headers["file-size"]), 10);

  if (!fs.existsSync(fileStore)) {
    fs.mkdirSync(fileStore);
  }

  if (!fileSize) {
    res.status(400).send("No file-size header found");
    res.end(400);
    return;
  }

  if (!uniqueFileId) {
    res.status(400).send("No x-file-name header found");
    res.end(400);
    return;
  }

  if (uniqueFileId) {
    try {
      // const fileName = path.parse(uniqueFileId).name;
      // const fileStats = fs.statSync(`${fileStore}${fileName}`);
      const uploadStats = fs.statSync(`${fileStore}${uniqueFileId}`);
      if (uploadStats.isFile()) {
        if (fileSize === uploadStats.size) {
          res.send({
            status: "ALREADY_UPLOADED_FILE",
            uploaded: uploadStats.size,
          });
          return;
        }
        if (!uploads[uniqueFileId]) uploads[uniqueFileId] = {};
        uploads[uniqueFileId]["bytesReceived"] = uploadStats.size;
        res.send({ uploaded: uploadStats.size });
      }
    } catch (err) {
      const upload = uploads[uniqueFileId];
      if (upload)
        res.send({ uploaded: upload.bytesReceived, status: "RESUMED_FILE" });
      else res.send({ uploaded: 0, status: "NEW_FILE" });
    }
  }
});

router.post("/complete/:channel", (req, res) => {
  const fileStore = channelToFileStore[req.params.channel];
  console.log("OsUpload complete process is called.");
  const uniqueFileId = String(req.headers["x-file-name"]);
  const fileName = path.parse(uniqueFileId).name;
  try {
    const uploadStats = fs.statSync(`${fileStore}${uniqueFileId}`);
    if (uploadStats.isFile()) {
      fs.renameSync(`${fileStore}${uniqueFileId}`, `${fileStore}${fileName}`);
      console.log(`Renamed ${uniqueFileId} to  ${fileName}`);
    }
    res.status(201).send({ status: "SUCCESSFULLY_UPLOADED" });
  } catch (err) {
    res.status(500).send(`Failed to finalize the upload: ${err}`);
    res.end();
  }

  delete uploads[uniqueFileId];
});

router.delete("/delete/:channel", (req, res) => {
  const fileStore = channelToFileStore[req.params.channel];
  const fileName = String(req.headers["x-file-name"]);
  try {
    const fileStats = fs.statSync(`${fileStore}${fileName}`);
    if (fileStats.isFile()) {
      console.log(`file deletion process is called: ${fileStore}${fileName}`);
      fs.unlinkSync(`${fileStore}${fileName}`);
      console.log(`Deleted ${fileStore}${fileName}`);
      res.status(201).send({ status: "DELETEED_FILE" });
    }
  } catch (err) {
    res.status(500).send(`Delete file error: ${err}`);
    res.end();
  }
});

router.get("/file/:channel/:filename", async (req, res) => {
  const channel = req.params.channel;
  const fileStore = channelToFileStore[channel];
  const fileName = req.params.filename;
  if (channel === "cfgUpload" && fileName === "full-static-table") {
    /* request full static table */
    const staticContent = await populateStaticData();
    res.send(staticContent);
  } else
    try {
      const fileStats = fs.statSync(`${fileStore}${fileName}`);
      if (fileStats.isFile()) {
        const fileContent = fs.readFileSync(
          `./${fileStore}${fileName}`,
          "utf8"
        );
        res.send(fileContent);
      } else res.end();
    } catch (err) {
      res.status(500).send(`Can't open the file: ${err}`);
      res.end();
    }
});

module.exports = router;
