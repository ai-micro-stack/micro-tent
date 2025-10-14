const AdmZip = require("adm-zip");

async function stackExtractZip(zipFilePath, destinationPath, overWrite = true) {
  try {
    console.log(zipFilePath);
    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(destinationPath, overWrite); // overWrite: true, overwrites existing files
    console.log("Extraction complete.");
  } catch (err) {
    console.error("Error extracting zip file:", err);
  }
}

module.exports = { stackExtractZip };
