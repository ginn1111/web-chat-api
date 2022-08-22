const router = require("express").Router();
const User = require("../models/User");
const Token = require("../models/Token");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const {
  uploadDefaultAvatar,
  uploadDefaultCoverPicture,
  getURLAvatar,
  getURLCoverPicture,
} = require("../services/firebase");

// [USER FUNCTIONS]
// <-- Generate Access Token -->
function genarateAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
}
// <-- Generate Refresh Token -->
function genarateRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "365d",
  });
}

// [REGISTER]
router.post("/register", async (req, res) => {
  // Take all information from client
  // with all corresponding information declared in mongo Model
  const newUser = new User({
    email: req.body.email,
    password: CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SECURE
    ).toString(),
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    gender: req.body.gender,
    birthday: req.body.birthday,
    phone: req.body.phone,
  });
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(500).json("Email has already in used!");
    }

    await uploadDefaultAvatar(newUser._id);
    await uploadDefaultCoverPicture(newUser._id);

    newUser.avatar = await getURLAvatar(newUser._id);
    newUser.coverPicture = await getURLCoverPicture(newUser._id);

    await newUser.save();
    // Take all information about new user and
    // send to client (just for testing api,
    // in fact, we do not send any information after registering)
    res.status(200).json("Your new account has been created successfully!");
  } catch (error) {
    console.log({ error });
    res.status(500).json(error);
  }
});

// [LOGIN]
router.post("/login", async (req, res) => {
  try {
    // Find the user with ralevant email in db
    const user = await User.findOne({ email: req.body.email });
    // If no user found, send the error
    if (!user) {
      return res.status(401).json("Wrong credentials!");
    }

    // Decode password of user gotten from db to blank text password
    const hashedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.PASS_SECURE
    );
    const originPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

    // Check if the request password match with decode password above,
    // if not, send error
    if (originPassword !== req.body.password) {
      return res.status(401).json("Wrong credentials!");
    }

    // else, genarate the token and send information to client
    const accessToken = genarateAccessToken({ id: user._id });
    const refreshToken = genarateRefreshToken({ id: user._id });

    await Token.create({
      userId: user._id,
      refreshToken: refreshToken,
    });

    res.cookie("refreshToken", refreshToken, {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    // Take all information of user but the password
    const { password, ...others } = user._doc;
    res.status(200).json({ ...others, accessToken: accessToken });
  } catch (error) {
    res.status(500).json(error);
  }
});

// [LOGOUT]
router.post("/:id/logout", async (req, res) => {
  try {
    const result = await Token.deleteMany({ userId: req.params.id });
    if (result.deletedCount) {
      res.clearCookie("refreshToken");
      res.status(200).json("Logged out successfully!");
    } else {
      res.status(400).json("You cannot log out!");
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// [REFRESH TOKEN]
router.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json("You are not authenticated 1!");
  }
  try {
    const userId = req.body.userId;
    const [token] = await Token.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(1);
    if (!token) {
      return res.status(401).json("You are not authenticated 2!");
    }

    if (token.refreshToken !== refreshToken) {
      return res.status(403).json("Invalid refresh token!");
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (error, user) => {
        if (error) {
          return res.status(403).json("You are not authorized!");
        }
        const newAccessToken = genarateAccessToken({ id: user.id });
        const newRefreshToken = genarateRefreshToken({ id: user.id });
        await token.updateOne({
          $set: { refreshToken: newRefreshToken },
        });
        res.cookie("refreshToken", newRefreshToken, {
          path: "/",
          httpOnly: true,
          secure: false,
          sameSite: "strict",
        });
        res.status(200).json({ accessToken: newAccessToken });
      }
    );
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
