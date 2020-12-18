module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login/You have to login for getting started");
  }
  next();
};
