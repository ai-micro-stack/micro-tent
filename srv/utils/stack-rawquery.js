require("module-alias/register");
const { StackRawQuery } = require("@utils/stackDatabase");

if (process.argv.length < 3) {
  console.log("Missing arguments ...");
  console.log("Syntax: node ./stack-rawquery.js <rawquery> [<options>]");
} else {
  const rawquery = process.argv[2];
  const options = process.argv[3] ?? "{}";
  const rslt = StackRawQuery(rawquery, JSON.parse(options));
  console.log(JSON.stringify(rslt, null, 4));
}
