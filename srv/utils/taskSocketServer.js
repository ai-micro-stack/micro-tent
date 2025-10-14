require("module-alias/register");
const path = require("path");
const SSHClient = require("ssh2").Client;
// const utf8 = require("utf8");
// const { Server } = require("socket.io");
const socketUser = require("@middleware/socketMiddleware");
const { GetTask, UpdateTask } = require("@utils/taskQueue");

// const http = require("http");
// const httpServer = http.createServer(app);
// const ssh2Config = {
//   host: "",
//   port: 22,
//   username: "",
//   password: "",
// };

function removeCtlChars(str) {
  // The regex matches any control character (U+0000-U+001F, U+007F-U+009F)
  // except for carriage return (U+000D) and line feed (U+000A).
  // The `g` flag ensures all occurrences are replaced.
  return str.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
  //
  // return str.replace(/[^\r\n\x20-\x7E]/g, "");
}

//Socket Connection
function socketServer(httpServer, ssh2Config) {
  const io = require("socket.io")(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });
  io.use((socket, next) => {
    socketUser(socket, next);
  });

  io.on("connection", async function (socket) {
    const { userId } = socket.currentUser;
    const ssh = new SSHClient();
    ssh
      .on("ready", function () {
        socket.emit("data", "\r\n*** SSH CONNECTION ESTABLISHED ***\r\n");
        // connected = true;
        // UpdateTask(
        //   userId,
        //   userTask.id,
        //   1 // userTask.taskStatus
        // );

        ssh.shell(async (err, stream) => {
          if (err)
            return socket.emit(
              "data",
              "\r\n*** SSH SHELL ERROR: " + err.message + " ***\r\n"
            );

          let userTask = await GetTask(userId);
          while (userTask) {
            // const taskData = userTask.taskData;
            console.log(JSON.stringify(userTask, null, 2));

            await UpdateTask(
              userId,
              userTask.id,
              1 // userTask.taskStatus
            );

            const taskData = JSON.parse(userTask.task_data);
            console.log(JSON.stringify(taskData, null, 2));
            const commandPath = path.join(
              __dirname, // utils
              "../", // srv
              "../", // micro-tent
              `${taskData.cwd}`
            );
            console.log(`cd ${commandPath}\n`);
            console.log(`${taskData.cmd}\n`);
            stream.write(`cd ${commandPath}\n`);
            stream.write(`${taskData.cmd}\n`);

            userTask = await GetTask(userId);
          }
          stream.write(`exit\n`);

          socket.on("data", function (data) {
            stream.write(data);
          });

          stream
            .on("data", function (d) {
              // socket.emit("data", utf8.decode(d.toString("binary")));
              socket.emit("data", removeCtlChars(d.toString()));
              // socket.emit("data", d.toString("binary"));
            })
            .on("close", function () {
              ssh.end();
            });
        });
      })
      .on("close", function () {
        socket.emit("data", "\r\n*** SSH CONNECTION CLOSED ***\r\n");
        // ClearTask(userId);

        // UpdateTask(
        //   userId,
        //   userTask.id,
        //   2 // userTask.taskStatus
        // );
      })
      .on("error", function (err) {
        console.log(err);
        socket.emit(
          "data",
          "\r\n*** SSH CONNECTION ERROR: " + err.message + " ***\r\n"
        );
      })
      .connect(ssh2Config);
  });
}

module.exports = { socketServer };
