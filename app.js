require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const session = require("express-session")({
  secret: process.env.sessionKey,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 24 * 5 * 1000,
  },
});

const { MONGOCONNECTURL } = require("./keys");

const app = express();

//Using ejs as View Engine
app.set("view engine", "ejs");

//Static folder
app.use("/public", express.static(path.join(__dirname, "public")));

//Routes
const authRoutes = require("./routes/auth");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(session);

//Using Routes
app.use(authRoutes);

//Landing Page
app.get("/", (req, res) => {
  res.render("home");
});

//404 Handler
app.use((req, res) => {
  res.render("error", {
    pageTitle: "Error : 404",
    errorCode: "404",
    errorDescription: "Page Not Found",
  });
});

//Server listening on port and mongoose connect
mongoose
  .connect(MONGOCONNECTURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    app.listen(8000);
    console.log("server has started on 8000");
  })
  .catch((err) => {
    console.log(err);
  });
