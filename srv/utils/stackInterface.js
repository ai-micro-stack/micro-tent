require("module-alias/register");
const dotenv = require("dotenv");
const os = require("os");
const Subnet = require("@models/subnet.model");
const { AddInterfaces, AddSubnets } = require("@utils/stackResource");

// environment variables
const environment = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
dotenv.config({ path: `.env.${environment}` });
const { INVISIBLE_NIC } = process.env;
const hiddenInterfaces = INVISIBLE_NIC.split(",");

const StackInterface = async () => {
  const nicData = [];
  const nicList = os.networkInterfaces();
  for (nicName in nicList) {
    const nets = nicList[nicName].filter((net) => {
      return !hiddenInterfaces.includes(nicName) && net.internal === false;
      // return net.internal === false; // && net.family === "IPv4";
    });
    // .map((net) => {
    //   const ipScope = cidrParser(net.cidr);
    //   return { ...net, ...ipScope };
    // });
    if (nets.length) {
      nicData.push({ nic_name: nicName, nic_mac: nets[0].mac, subnets: nets });
    }
  }

  // update interfaces
  await AddInterfaces(nicData);
  const existingNet = await Subnet.findAll({
    where: {
      mac: nicData.map((n) => n.subnets[0].mac),
      cidr: nicData.map((n) => n.subnets[0].cidr),
    },
  });

  // add new subnets
  const newFoundNet = nicData
    .map((n) => n.subnets[0])
    .filter((n) => {
      return (
        existingNet.find((net) => net.mac === n.mac && net.cidr === n.cidr) ===
        undefined
      );
    });
  await AddSubnets(newFoundNet);

  return nicData;
};

module.exports = StackInterface;
