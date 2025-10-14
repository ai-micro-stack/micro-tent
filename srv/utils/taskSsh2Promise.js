const { Client } = require("ssh2");

function ssh2Promise(cmd, host, user, pwd) {
  const conn = new Client();

  const tunnelConfig = {
    host: `${host}`,
    port: 22,
    username: `${user}`,
    password: `${pwd}`,
  };

  return new Promise((resolve, reject) => {
    let allData = "";
    try {
      conn
        .on("ready", () => {
          conn.exec(`${cmd}`, (err, stream) => {
            if (err) {
              reject(err);
              conn.end();
              return;
            }
            stream.on("data", (data) => {
              allData += data;
            });
            stream.on("close", (code, signal) => {
              resolve(allData);
              conn.end();
            });
            stream.on("error", (data) => {
              allData += data;
              reject(data);
            });
          });
        })
        .connect(tunnelConfig);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { ssh2Promise };
