require("dotenv").config();
const User = require("../models/user");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.servermailID,
    pass: process.env.servermailPass,
  },
});

exports.getDetails = (req, res) => {
  res.render("details", {
    pageTitle: "User Details",
    name: req.session.user.name,
    email: req.session.user.email,
    age: req.session.user.age,
    gender: req.session.user.gender,
    image: req.session.user.image || undefined,
  });
};

exports.login = (req, res) => {
  if (req.session.isLoggedIn) {
    res.redirect("/details");
  } else {
    let msg = req.params.msg;
    res.render("auth/login", { pageTitle: "login", msg: msg });
  }
};

exports.doLogin = (req, res) => {
  const email = req.body.email;
  const pass = req.body.pass;
  User.findOne({ email: email }).then((user) => {
    if (!user) {
      return res.redirect("/login/credentials are wrong");
    }
    bcrypt
      .compare(pass, user.password)
      .then((result) => {
        if (result) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save((err) => {
            if (err) {
              console.log(err);
            }
            res.redirect("/details");
          });
        }
        res.redirect("/login/credentials are wrong");
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/login/error");
      });
  });
};

exports.signup = (req, res) => {
  if (req.session.isLoggedIn) {
    res.redirect("/details");
  } else {
    let msg = req.params.msg;
    res.render("auth/signup", { pageTitle: "SignUp", msg: msg });
  }
};

exports.doSignup = (req, res) => {
  const email = req.body.email;
  const pass = req.body.pass;
  const name = req.body.name;
  const age = req.body.age;
  const gender = req.body.gender;
  const image = req.file;
  User.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        return res.redirect("/signup/Email Exists");
      }
      if (!image) {
        return res.redirect("/signup/Attached file is not an image.");
      }
      return bcrypt.hash(pass, 12).then((hashedPass) => {
        const user = new User({
          email: email,
          password: hashedPass,
          name: name,
          age: age,
          gender: gender,
          image: image.path,
        });
        return user.save();
      });
    })
    .then((result) => {
      if (result) {
        res.redirect("/login/Account Created, Login to Continue");
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
};

exports.forgot = (req, res) => {
  if (req.session.isLoggedIn) {
    res.redirect("/details");
  } else {
    let msg = req.params.msg;
    res.render("auth/forgot", { pageTitle: "Recover Password", msg: msg });
  }
};

exports.doForgot = (req, res) => {
  const email = req.body.email;
  var userInfo;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      res.redirect("/forgot/Token Gen Failed");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          return res.redirect("/forgot/Email Does not Exist");
        }
        userInfo = user;
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        let link = "http://" + req.headers.host + "/reset/" + token;
        transporter.sendMail(
          {
            to: email,
            from: "vaniyayusufiya@gmail.com",
            subject: "Password Reset",
            html: `<h1>Password Reset Requested</h1>
                <p>Hi ${userInfo.name},</p>                    
                <p>Copy Paste this link in address bar and hit enter  </p>
                <p><a href="">${link}</a></p>
                <p>The Link will expire in ten minutes if not used.</p>
                <p>If you have not made this request, please contact our customer support immediately.</p>
                <p><br>Thank You,</p>`,
          },
          (err, info) => {
            if (err) {
              console.log(err);
              res.redirect("/forgot/Mailing Error");
            } else {
              res.redirect("/login/Link has been sent to your mail");
            }
          }
        );
      });
  });
};

exports.newPassword = (req, res) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      if (user) {
        res.render("auth/new-password", {
          pageTitle: "Update Password",
          userId: user._id.toString(),
          token: token,
        });
      } else {
        res.redirect("/login/Token Invalid or Expired");
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.doNewPassword = (req, res) => {
  const pass = req.body.pass;
  const userId = req.body.userId;
  const token = req.body.token;
  let resetUser;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(pass, 12);
    })
    .then((hashed) => {
      resetUser.password = hashed;
      resetUser.resetToken = null;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login/Password Changed!");
    })
    .catch((err) => {
      console.log(err);
    });
};
