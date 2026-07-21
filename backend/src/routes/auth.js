const router = require("express").Router();
const {
  register,
  registerValidation,
  login,
  refresh,
  logout,
  me,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post("/register", authLimiter, registerValidation, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

module.exports = router;
