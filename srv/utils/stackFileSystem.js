const fs = require('fs');

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath);
      console.log(`Directory '${dirPath}' created successfully.`);
    } catch (error) {
      console.error(`Error creating directory '${dirPath}':`, error);
      throw error;
    }
  } else {
    console.log(`Directory '${dirPath}' already exists.`);
  }
}

module.exports = { ensureDirExists };
