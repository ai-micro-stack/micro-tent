require("module-alias/register");
const Static = require("@models/static.model");

function parseStaticData(data) {
  const lines = data.split(/\r?\n/);
  const statics = lines
    .map((l) => {
      const conf = l.split("=");
      if (conf.length > 1) {
        const fields = conf[1].split(",");
        const static = {
          mac_address: fields[0],
          ipv4_address: fields[1],
          hostname: fields.length > 2 ? fields[2] : "",
          lease_time: fields.length > 3 ? fields[3] : "",
          is_active: fields.length > 4 ? fields[4] : true,
          pingable: false,
        };
        return static;
      }
      return null;
    })
    .filter((l) => {
      return l !== null;
    });
  return statics;
}

async function populateStaticData() {
  try {
    const staticRows = await Static.findAll();
    const content = staticRows
      .sort((a, b) => a.hostname.localeCompare(b.hostname))
      .map((h) => {
        return `dhcp-host=${h.mac_address},${h.ipv4_address},${h.hostname},${h.lease_time}`;
      });
    return content.join(`\n`);
  } catch (err) {
    return err.toString();
  }
}

module.exports = { parseStaticData, populateStaticData };
