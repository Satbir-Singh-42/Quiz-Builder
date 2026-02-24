import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "change-me-in-production";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    console.warn(
      "WARNING: SESSION_SECRET not set. Using fallback. Set SESSION_SECRET in production.",
    );
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "quiz-builder-dev-fallback-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post(
    "/api/register",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username, password, adminSecret } = req.body;

        if (!username || !password) {
          return res
            .status(400)
            .json({ message: "Username and password are required." });
        }

        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res
            .status(400)
            .json({
              message:
                "Username already exists. Please choose another username.",
            });
        }

        // Validate admin secret — only users who provide the correct secret can register
        if (!adminSecret || adminSecret !== ADMIN_SECRET) {
          return res.status(403).json({
            message:
              "Invalid admin secret. Please contact an administrator to get the registration code.",
          });
        }

        const user = await storage.createUser({
          username,
          password: await hashPassword(password),
          isAdmin: true,
        });

        req.login(user, (err) => {
          if (err) return next(err);
          res.status(201).json(user);
        });
      } catch (error) {
        console.error("Registration error:", error);
        if (error instanceof Error) {
          return res.status(400).json({ message: error.message });
        }
        next(error);
      }
    },
  );

  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      (err: any, user: Express.User | false, info: any) => {
        if (err) return next(err);
        if (!user)
          return res.status(401).json({ message: "Invalid credentials" });

        req.login(user, (err) => {
          if (err) return next(err);
          res.status(200).json(user);
        });
      },
    )(req, res, next);
  });

  app.post("/api/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
