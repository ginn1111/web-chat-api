const jwt = require("jsonwebtoken");

// This middleware use to check whether the user logged in
const verifyToken = (req, res, next) => {
  // Take the 'token' from headers['x-authorization']
  const authHeader = req.headers["x-authorization"];

  // If 'token' exists, verify it
  if (authHeader) {
    // Sent headers['x-authorization'] in form `Bearer <token>`,
    // split it by a space and take the second elements => the needed token
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      // If error occurs in verify process, sent error
      if (err) {
        return res.status(403).json("You are not authorized 1!");
      }
      // else add new key: value to request
      req.user = user;
      // next(): pass this middleware and come to the next request
      next();
    });
  } else {
    // sent error if 'token' does not exist
    return res.status(401).json("You are not authenticated!");
  }
};

// This middleware use to check the authorization of the request user
const verifyTokenAndAuthorization = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id) {
      next();
    } else {
      return res.status(403).json("You are not authorized!");
    }
  });
};
module.exports = {
  verifyToken,
  verifyTokenAndAuthorization,
};
