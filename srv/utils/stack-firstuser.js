const stackFirstUser = require("./stackFirstUser");

if (process.argv.length < 4) {
  console.log("Missing arguments ...");
  console.log("Coorect syntax: node ./first-user.js <username> <password>");
} else {
  const username = process.argv[2];
  const password = process.argv[3];
  stackFirstUser({ username, password });
}
