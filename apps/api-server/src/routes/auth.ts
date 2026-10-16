import { Router } from "express";
import { LoginBody } from "@workspace/api-zod";
import { config } from "../config/env";
import { verifyPassword, timingSafeStringEqual } from "../lib/auth-crypto";

const router = Router();

router.post("/auth/login", (req, res): void => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.username || !parsed.data.password) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const { username, password } = parsed.data;

  const configuredUsername = config.adminUsername;
  const configuredHash = config.adminPasswordHash;
  const configuredPlain = config.adminPassword;

  // Fail safely if no credentials are configured
  if (!configuredHash && !configuredPlain) {
    res.status(401).json({ error: "Admin authentication is not configured" });
    return;
  }

  // Timing-safe check on username
  const usernameMatches = timingSafeStringEqual(
    username.trim().toLowerCase(),
    configuredUsername.toLowerCase()
  );

  // Timing-safe verification on password
  const targetSecret = configuredHash || configuredPlain;
  const passwordMatches = verifyPassword(password, targetSecret);

  if (usernameMatches && passwordMatches) {
    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err): void => {
      if (err) {
        res.status(500).json({ error: "Failed to create secure session" });
        return;
      }
      (req.session as any).authenticated = true;
      (req.session as any).username = configuredUsername;
      req.session.save((saveErr): void => {
        if (saveErr) {
          res.status(500).json({ error: "Failed to persist session" });
          return;
        }
        res.json({ ok: true, username: configuredUsername });
      });
    });
    return;
  }

  res.status(401).json({ error: "Invalid credentials" });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err): void => {
    res.clearCookie("escora.sid", {
      path: "/",
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "lax",
    });
    if (err) {
      res.status(500).json({ error: "Failed to terminate session" });
      return;
    }
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res): void => {
  if ((req.session as any)?.authenticated) {
    res.json({ authenticated: true, username: (req.session as any).username });
    return;
  }
  res.status(401).json({ authenticated: false });
});

export default router;
