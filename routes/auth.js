const express = require("express");
const authController = require("../controllers/auth");
const router = express.Router();
const isAuthenticated = require("../middlewares/isAuthenticated");

router.get("/details", isAuthenticated, authController.getDetails);

router.get("/login", authController.login);
router.get("/login/:msg", authController.login);
router.post("/login", authController.doLogin);

router.get("/signup", authController.signup);
router.get("/signup/:msg", authController.signup);
router.post("/signup", authController.doSignup);

router.get("/logout", authController.logout);

router.get("/forgot", authController.forgot);
router.get("/forgot/:msg", authController.forgot);
router.post("/forgot", authController.doForgot);

router.get("/reset/:token", authController.newPassword);
router.post("/reset", authController.doNewPassword);

module.exports = router;
