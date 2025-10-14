const fs = require("fs");

const rackDir = "./modules/rack";
const confDir = `${rackDir}/config`;
const ConfFile = `${confDir}/pxe-server.conf`;

function getConfValue(paramName) {
  let confValue = "";
  if (fs.existsSync(ConfFile)) {
    confValue = fs
      .readFileSync(ConfFile, "utf8")
      .split(/\r?\n/)
      .map((line) => {
        return line.split("#")[0].trim();
      })
      .filter((line) => {
        return line.startsWith(paramName);
      })
      .map((line) => {
        return line.split("=")[1].replace(/^"|"$/g, "");
      });
  }
  return confValue ? confValue : paramName === "dhcpDomain" ? "localhost" : "";
}

function cidrParser(ip4Cidr) {
  const ipScope = ["", "", "", "", ""];
  const [ipv4, cidr] = ip4Cidr.split("/");
  const ipParts = ipv4.split(".");
  const cidrInt = parseInt(cidr);
  const cidrCut = 32 - cidrInt;
  const buf = new ArrayBuffer(5 * 4);
  const i32 = new Uint32Array(buf);
  const i8 = new Uint8Array(buf);
  for (let i = 0; i < 4; i++) {
    i32[0] = 256 * i32[0] + parseInt(ipParts[i]);
    i32[4] = 256 * i32[4] + 255;
  }
  i32[0] >>>= cidrCut;
  i32[0] <<= cidrCut;
  i32[1] = i32[0] + 1;
  i32[2] = i32[0] + 2;
  i32[3] = i32[0] + Math.pow(2, cidrCut) - 2;
  i32[4] <<= cidrCut;
  let dot = "";
  for (let i = 3; i >= 0; i--) {
    ipScope[0] += dot + i8[i];
    ipScope[1] += dot + i8[4 + i];
    ipScope[2] += dot + i8[8 + i];
    ipScope[3] += dot + i8[12 + i];
    ipScope[4] += dot + i8[16 + i];
    dot = ".";
  }
  return {
    dhcpNetAddress: ipScope[0],
    dhcpNetMask: ipScope[4],
    dhcpStart: ipScope[2],
    dhcpEnd: ipScope[3],
    dhcpRouter: ipScope[1],
    dhcpDnsList: ipScope[1],
  };
}

module.exports = { getConfValue, cidrParser };
