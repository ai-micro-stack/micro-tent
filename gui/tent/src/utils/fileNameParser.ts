const fileNameParser = (fileName: string) => {
  const ext = fileName.split(".").pop() || "";
  const name = fileName.slice(0, fileName.length - ext.length - 1);
  return { name, ext };
};

export default fileNameParser;
