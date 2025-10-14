require("module-alias/register");
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { ensureDirExists } = require("@utils/stackFileSystem");
const { verifyToken, grantAccess } = require("@middleware/authMiddleware");

// Set the installer backend location of the pxe server setup scripts running enviroment
const rackDir = "./modules/rack";
const confDir = `${rackDir}/config`;
const setupDir = `${rackDir}/pxe/ipxe`;
const ConfFile = `${confDir}/pxe-server.conf`;

ensureDirExists(confDir);
let pxeRootCfg = [];
if (fs.existsSync(ConfFile)) {
  pxeRootCfg = fs
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
} else
  try {
    fs.writeFileSync(ConfFile, "");
    console.log("File created successfully.");
  } catch (err) {
    console.error("Error creating file:", err);
  }

// const mduStore = `${setupDir}/module/`;
const plgStore = `${setupDir}/plugin/`;
const pxeRoot = pxeRootCfg[0] ? pxeRootCfg[0] : "/pxeboot";
const isoStore = `${pxeRoot}/os-store/`;
const isoImage = `${pxeRoot}/os-image/`;
const bootMenu = `${pxeRoot}/os-menu/`;
const noOsMenu = ["--gap", "exit", "reboot", "shutdown"];

// The uploads in progress
let uploads = {};

router.get("/files", verifyToken, grantAccess([1, 2, 3, 9]), (req, res) => {
  const plgFiles = fs.readdirSync(plgStore).filter((item) => {
    const itemPath = `${plgStore}${item}`;
    return fs.statSync(itemPath).isFile() && path.extname(itemPath) === ".plg";
  });

  const isoFiles = fs.readdirSync(isoStore).filter((item) => {
    const itemPath = `${isoStore}${item}`;
    return fs.statSync(itemPath).isFile() && path.extname(itemPath) === ".iso";
  });

  const zipFiles = fs.readdirSync(isoStore).filter((item) => {
    const itemPath = `${isoStore}${item}`;
    return fs.statSync(itemPath).isFile() && path.extname(itemPath) === ".zip";
  });

  const imgNames = fs
    .readdirSync(isoImage, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name);

  let mnuItems = [];
  let menuDefault = "";
  if (fs.existsSync(`${bootMenu}/main.ipxe`)) {
    const fileContent = fs.readFileSync(`${bootMenu}/main.ipxe`, "utf8");
    // sample (=exit): choose --default exit --timeout 60000 option && goto ${option}
    // sample (no default): choose target && goto
    mnuItems = fileContent
      .split(/\r?\n/)
      .filter((line) => {
        return line.startsWith("item") && !line.includes("--gap");
      })
      .map((item) => item.split(/\s+/)[1])
      .filter((item) => {
        return !noOsMenu.some((v) => item.includes(v));
      });
    const bootDefault = fileContent.split(/\r?\n/).filter((line) => {
      return line.startsWith("choose") && line.includes("--default");
    });
    if (bootDefault.length > 0) {
      menuDefault = bootDefault[0].split(/\s+/)[2];
    }
  }

  const osNames = [
    ...new Set([
      ...isoFiles.map((isoFile) => path.basename(isoFile, ".iso")),
      ...zipFiles.map((zipFile) => path.basename(zipFile, ".zip")),
      ...imgNames,
      // ...mnuItems,
    ]),
  ];

  const pxeContext = osNames.map((osName) => {
    const plgName = osName + ".plg";
    const isoName = osName + ".iso";
    const zipName = osName + ".zip";
    return {
      osName,
      plgExists: plgFiles.includes(plgName),
      isoExists: isoFiles.includes(isoName),
      zipExists: zipFiles.includes(zipName),
      imgExists: imgNames.includes(osName),
      mnuExists: mnuItems.includes(osName),
    };
  });

  res.send({
    pxeContext,
    menuDefault,
  });
});

module.exports = router;
