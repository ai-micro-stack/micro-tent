const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const environment = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
dotenv.config({ path: `.env.${environment}` });
const { JWT_SECRET_KEY, DEBUG_MODE } = process.env;

function verifyToken(req, res, next) {
  if (DEBUG_MODE) next();
  const headerAuth = req.header("Authorization");
  if (!headerAuth)
    return res.status(401).json({ error: "No authorization header." });

  const accessToken = headerAuth.split(" ")[1];
  if (!accessToken)
    return res.status(401).json({ error: "No authorization token." });

  try {
    const decoded = jwt.verify(accessToken, `${JWT_SECRET_KEY}@ACC`);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid accessToken" });
  }
}

function grantAccess(requiredRoles) {
  if (DEBUG_MODE) next();
  return (req, res, next) => {
    const roleId = req.user.roleId;
    if (requiredRoles && !requiredRoles.includes(roleId)) {
      console.log("Access Denied! Required Roles: ");
      console.log(requiredRoles);
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
}

module.exports = { verifyToken, grantAccess };
