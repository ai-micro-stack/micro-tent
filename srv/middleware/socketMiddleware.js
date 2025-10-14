const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const environment = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
dotenv.config({ path: `.env.${environment}` });
const { JWT_SECRET_KEY } = process.env;

const socketUser = (socket, next) => {
  const token = socket.handshake.auth?.token;
  try {
    const decoded = jwt.verify(token, `${JWT_SECRET_KEY}@ACC`);
    // decoded is the full jwt object. you could even destructure
    socket.currentUser = decoded;
  } catch (err) {
    const socketError = new Error("NOT_AUTHORIZED");
    return next(socketError);
  }
  next();
};

module.exports = socketUser;
