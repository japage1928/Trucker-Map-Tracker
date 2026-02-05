// Authentication setup using Passport.js with local strategy
// Reference: javascript_auth_all_persistance integration
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Hash password with salt for secure storage
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare supplied password with stored hash
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Session secret should be set in environment variables for production
  const sessionSecret = process.env.SESSION_SECRET || "trucker-buddy-dev-secret";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true, // Prevents client-side JS from reading cookie
      sameSite: "lax", // CSRF protection
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for username/password auth
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  // Register new user with input validation
  app.post("/api/register", async (req, res, next) => {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || typeof username !== "string" || username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const user = await storage.createUser({
      username,
      password: await hashPassword(password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      // Don't return password hash to client
      res.status(201).json({ id: user.id, username: user.username, createdAt: user.createdAt });
    });
  });

  // Login existing user
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Don't return password hash to client
    const user = req.user as SelectUser;
    res.status(200).json({ id: user.id, username: user.username, createdAt: user.createdAt });
  });

  // Logout current user
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user info
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Don't return password hash to client
    const user = req.user as SelectUser;
    res.json({ id: user.id, username: user.username, createdAt: user.createdAt });
  });
}
