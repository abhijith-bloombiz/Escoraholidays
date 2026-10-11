import { Router } from "express";

const router = Router();

const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "Admin";

router.post("/auth/login", (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    (req.session as any).authenticated = true;
    (req.session as any).username = username;
    return res.json({ ok: true, username });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("escora.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res) => {
  if ((req.session as any).authenticated) {
    return res.json({ authenticated: true, username: (req.session as any).username });
  }
  return res.status(401).json({ authenticated: false });
});

export default router;
