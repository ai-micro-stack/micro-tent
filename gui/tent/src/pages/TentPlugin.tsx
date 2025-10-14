import PluginManager from "@/components/PluginManager";

const uploadChannel = "tentPlugin";
const allowedTypes: string[] = ["zip"];

function TentPlugin() {
  const managerTitle = "Tent Plugin Manager";
  return (
    <PluginManager
      channelParam={uploadChannel}
      allowedTypes={allowedTypes}
      managerTitle={managerTitle}
    />
  );
}

export default TentPlugin;
