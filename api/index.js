var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// api-src/index.ts
import "dotenv/config";
import express from "express";

// server/routes.ts
import { createServer } from "http";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// db/index.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertParticipantSchema: () => insertParticipantSchema,
  insertQuestionSchema: () => insertQuestionSchema,
  insertQuizSchema: () => insertQuizSchema,
  insertResultSchema: () => insertResultSchema,
  insertUserSchema: () => insertUserSchema,
  participants: () => participants,
  participantsRelations: () => participantsRelations,
  questions: () => questions,
  questionsRelations: () => questionsRelations,
  quizzes: () => quizzes,
  quizzesRelations: () => quizzesRelations,
  results: () => results,
  resultsRelations: () => resultsRelations,
  sessionTable: () => sessionTable,
  users: () => users,
  usersRelations: () => usersRelations
});
import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  json
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// shared/constants.ts
var AUTH = {
  MIN_USERNAME_LENGTH: 3,
  MIN_PASSWORD_LENGTH: 8,
  SESSION_MAX_AGE_MS: 24 * 60 * 60 * 1e3,
  // 24 hours
  SESSION_SECRET_FALLBACK: "quiz-builder-dev-fallback-secret",
  ADMIN_SECRET_FALLBACK: "change-me-in-production"
};
var ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  TAKE_QUIZ: "/take-quiz/:id",
  RESULTS: "/results/:id",
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_CREATE_QUIZ: "/admin/create-quiz",
  ADMIN_MANAGE_QUIZZES: "/admin/manage-quizzes",
  ADMIN_USER_RESULTS: "/admin/user-results"
};
var QUIZ_DEFAULTS = {
  DEFAULT_TIME_LIMIT: 30,
  // minutes
  DEFAULT_PASSING_SCORE: 60,
  // percentage
  MIN_OPTIONS: 2,
  MIN_QUESTIONS: 1
};
var DEPARTMENTS = [
  { value: "CE", label: "Civil Engineering" },
  { value: "CSE", label: "Computer Science and Engineering" },
  { value: "EE", label: "Electrical Engineering" },
  { value: "ECE", label: "Electronics and Communication Engineering" },
  { value: "IT", label: "Information Technology" },
  { value: "ME", label: "Mechanical Engineering" },
  { value: "other", label: "Other (write your own)" }
];
var KNOWN_DEPARTMENT_VALUES = DEPARTMENTS.filter(
  (d) => d.value !== "other"
).map((d) => d.value);
var SIDEBAR_MENU = [
  { title: "Dashboard", iconName: "LayoutDashboard", path: ROUTES.ADMIN },
  {
    title: "Create Quiz",
    iconName: "FilePlus",
    path: ROUTES.ADMIN_CREATE_QUIZ
  },
  {
    title: "Manage Quizzes",
    iconName: "FileQuestion",
    path: ROUTES.ADMIN_MANAGE_QUIZZES
  },
  { title: "User Results", iconName: "Users", path: ROUTES.ADMIN_USER_RESULTS }
];
var QUERY_CONFIG = {
  STALE_TIME_MS: 5 * 60 * 1e3,
  // 5 minutes
  RETRY: false
};
var VALIDATION = {
  MIN_NAME_LENGTH: 2,
  MIN_QUESTION_LENGTH: 3,
  MIN_QUIZ_TITLE_LENGTH: 3
};

// shared/schema.ts
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var sessionTable = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true
}).extend({
  username: z.string().min(
    AUTH.MIN_USERNAME_LENGTH,
    `Username must be at least ${AUTH.MIN_USERNAME_LENGTH} characters`
  ),
  password: z.string().min(
    AUTH.MIN_PASSWORD_LENGTH,
    `Password must be at least ${AUTH.MIN_PASSWORD_LENGTH} characters`
  )
});
var participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  rollNumber: text("roll_number").notNull().unique(),
  class: text("class").notNull(),
  department: text("department").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertParticipantSchema = createInsertSchema(participants).pick({
  fullName: true,
  rollNumber: true,
  class: true,
  department: true
}).extend({
  fullName: z.string().min(
    VALIDATION.MIN_NAME_LENGTH,
    `Name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`
  ),
  rollNumber: z.string().min(1, "Roll number is required"),
  class: z.string().min(1, "Year is required"),
  department: z.string().min(1, "Department is required")
});
var quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  timeLimit: integer("time_limit").notNull(),
  // in minutes
  passingScore: integer("passing_score").default(QUIZ_DEFAULTS.DEFAULT_PASSING_SCORE).notNull(),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertQuizSchema = createInsertSchema(quizzes).pick({
  title: true,
  description: true,
  timeLimit: true,
  passingScore: true,
  creatorId: true,
  isActive: true,
  password: true
}).extend({
  title: z.string().min(
    VALIDATION.MIN_QUIZ_TITLE_LENGTH,
    `Title must be at least ${VALIDATION.MIN_QUIZ_TITLE_LENGTH} characters`
  ),
  description: z.string().nullish(),
  timeLimit: z.coerce.number().int().positive("Time limit must be positive"),
  passingScore: z.coerce.number().int().min(1, "Min 1%").max(100, "Max 100%").default(QUIZ_DEFAULTS.DEFAULT_PASSING_SCORE)
});
var questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => quizzes.id).notNull(),
  text: text("text").notNull(),
  options: json("options").$type().notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertQuestionSchema = createInsertSchema(questions).pick({
  quizId: true,
  text: true,
  options: true,
  correctAnswer: true
}).extend({
  text: z.string().min(
    VALIDATION.MIN_QUESTION_LENGTH,
    `Question must be at least ${VALIDATION.MIN_QUESTION_LENGTH} characters`
  ),
  options: z.array(z.string().min(1, "Option cannot be empty")).min(
    QUIZ_DEFAULTS.MIN_OPTIONS,
    `At least ${QUIZ_DEFAULTS.MIN_OPTIONS} options required`
  ),
  correctAnswer: z.number().int().min(0)
});
var results = pgTable("results", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id").references(() => participants.id).notNull(),
  quizId: integer("quiz_id").references(() => quizzes.id).notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  timeTaken: integer("time_taken").notNull(),
  // in seconds
  answers: json("answers").$type().notNull(),
  canRetake: boolean("can_retake").default(false).notNull(),
  ipAddress: text("ip_address"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull()
});
var insertResultSchema = createInsertSchema(results).pick({
  participantId: true,
  quizId: true,
  score: true,
  totalQuestions: true,
  timeTaken: true,
  answers: true,
  canRetake: true
}).extend({
  score: z.number().int().min(0),
  totalQuestions: z.number().int().positive(),
  timeTaken: z.number().int().min(0),
  answers: z.array(
    z.object({
      questionId: z.number(),
      selectedAnswer: z.number()
    })
  )
});
var usersRelations = relations(users, ({ many }) => ({
  createdQuizzes: many(quizzes)
}));
var quizzesRelations = relations(quizzes, ({ one, many }) => ({
  creator: one(users, { fields: [quizzes.creatorId], references: [users.id] }),
  questions: many(questions),
  results: many(results)
}));
var questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, { fields: [questions.quizId], references: [quizzes.id] })
}));
var participantsRelations = relations(participants, ({ many }) => ({
  results: many(results)
}));
var resultsRelations = relations(results, ({ one }) => ({
  participant: one(participants, {
    fields: [results.participantId],
    references: [participants.id]
  }),
  quiz: one(quizzes, { fields: [results.quizId], references: [quizzes.id] })
}));

// db/index.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: false
    });
  }
  // User methods
  async getUser(id) {
    return await db.query.users.findFirst({
      where: eq(users.id, id)
    });
  }
  async getUserByUsername(username) {
    return await db.query.users.findFirst({
      where: eq(users.username, username)
    });
  }
  async createUser(user) {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }
  // Participant methods
  async createParticipant(participant) {
    const [createdParticipant] = await db.insert(participants).values(participant).returning();
    return createdParticipant;
  }
  async getParticipant(id) {
    return await db.query.participants.findFirst({
      where: eq(participants.id, id)
    });
  }
  async getParticipantByRollNumber(rollNumber) {
    return await db.query.participants.findFirst({
      where: eq(participants.rollNumber, rollNumber)
    });
  }
  // Quiz methods
  async createQuiz(quiz) {
    const [createdQuiz] = await db.insert(quizzes).values(quiz).returning();
    return createdQuiz;
  }
  async getQuiz(id, includeInactive = false) {
    return await db.query.quizzes.findFirst({
      where: includeInactive ? eq(quizzes.id, id) : and(eq(quizzes.id, id), eq(quizzes.isActive, true)),
      with: {
        questions: true
      }
    });
  }
  async getAllQuizzes(includeInactive = false) {
    return await db.query.quizzes.findMany({
      where: includeInactive ? void 0 : eq(quizzes.isActive, true),
      orderBy: desc(quizzes.createdAt),
      with: {
        questions: true
      }
    });
  }
  async updateQuiz(id, quiz) {
    const [updatedQuiz] = await db.update(quizzes).set({ ...quiz, updatedAt: /* @__PURE__ */ new Date() }).where(eq(quizzes.id, id)).returning();
    return updatedQuiz;
  }
  async deleteQuiz(id) {
    const result = await db.update(quizzes).set({ isActive: false }).where(eq(quizzes.id, id)).returning();
    return result.length > 0;
  }
  // Question methods
  async createQuestion(question) {
    const [createdQuestion] = await db.insert(questions).values(question).returning();
    return createdQuestion;
  }
  async getQuestionsByQuizId(quizId) {
    return await db.query.questions.findMany({
      where: eq(questions.quizId, quizId)
    });
  }
  async updateQuestion(id, question) {
    const [updatedQuestion] = await db.update(questions).set(question).where(eq(questions.id, id)).returning();
    return updatedQuestion;
  }
  async deleteQuestion(id) {
    const result = await db.delete(questions).where(eq(questions.id, id)).returning();
    return result.length > 0;
  }
  async createQuestionsBulk(questions2) {
    if (questions2.length === 0) return [];
    return await db.insert(questions).values(questions2).returning();
  }
  async deleteQuestionsByQuizId(quizId) {
    const result = await db.delete(questions).where(eq(questions.quizId, quizId)).returning();
    return result.length;
  }
  // Result methods
  async createResult(result) {
    const [createdResult] = await db.insert(results).values(result).returning();
    return createdResult;
  }
  async getResult(id) {
    return await db.query.results.findFirst({
      where: eq(results.id, id)
    });
  }
  async getResultsByQuizId(quizId) {
    return await db.query.results.findMany({
      where: eq(results.quizId, quizId),
      orderBy: desc(results.submittedAt)
    });
  }
  async getResultsByParticipantId(participantId) {
    return await db.query.results.findMany({
      where: eq(results.participantId, participantId),
      orderBy: desc(results.submittedAt)
    });
  }
  async getResultWithDetails(id) {
    const result = await db.query.results.findFirst({
      where: eq(results.id, id),
      with: {
        participant: true,
        quiz: true
      }
    });
    if (!result) return void 0;
    const questions2 = await this.getQuestionsByQuizId(result.quizId);
    return {
      ...result,
      questions: questions2
    };
  }
  async getAllResults(sortBy = "date", quizId) {
    const results2 = await db.query.results.findMany({
      where: quizId ? eq(results.quizId, quizId) : void 0,
      with: {
        participant: true,
        quiz: true
      },
      orderBy: sortBy === "score" ? desc(results.score) : desc(results.submittedAt)
    });
    return results2;
  }
  async updateResultRetake(id, canRetake) {
    const [updatedResult] = await db.update(results).set({ canRetake }).where(eq(results.id, id)).returning();
    return updatedResult;
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
var ADMIN_SECRET = process.env.ADMIN_SECRET || AUTH.ADMIN_SECRET_FALLBACK;
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
  if (!process.env.SESSION_SECRET) {
    console.warn(
      "WARNING: SESSION_SECRET not set. Using auto-generated secret. Sessions will reset on restart."
    );
  }
  const sessionSettings = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: AUTH.SESSION_MAX_AGE_MS
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post(
    "/api/register",
    async (req, res, next) => {
      try {
        const { username, password, adminSecret } = req.body;
        if (!username || !password) {
          return res.status(400).json({ message: "Username and password are required." });
        }
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({
            message: "Username already exists. Please choose another username."
          });
        }
        if (!adminSecret || adminSecret !== ADMIN_SECRET) {
          return res.status(403).json({
            message: "Invalid admin secret. Please contact an administrator to get the registration code."
          });
        }
        const user = await storage.createUser({
          username,
          password: await hashPassword(password),
          isAdmin: true
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
    }
  );
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate(
      "local",
      (err, user) => {
        if (err) return next(err);
        if (!user)
          return res.status(401).json({ message: "Invalid credentials" });
        req.login(user, (err2) => {
          if (err2) return next(err2);
          res.status(200).json(user);
        });
      }
    )(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(200).json(null);
    res.json(req.user);
  });
}

// server/routes.ts
import { z as z2 } from "zod";
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden: admin access required" });
}
function parseId(value) {
  const id = parseInt(value ?? "", 10);
  return Number.isFinite(id) && id > 0 ? id : NaN;
}
async function registerRoutes(app2) {
  setupAuth(app2);
  const httpServer = createServer(app2);
  app2.post("/api/participants", async (req, res) => {
    try {
      const validatedData = insertParticipantSchema.parse(req.body);
      const existingParticipant = await storage.getParticipantByRollNumber(
        validatedData.rollNumber
      );
      if (existingParticipant) {
        return res.status(200).json(existingParticipant);
      }
      const participant = await storage.createParticipant(validatedData);
      res.status(201).json(participant);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating/finding participant:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/participants/roll/:rollNumber", async (req, res) => {
    try {
      const { rollNumber } = req.params;
      const participant = await storage.getParticipantByRollNumber(rollNumber);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      res.json(participant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch participant" });
    }
  });
  app2.get("/api/participants/:id", async (req, res) => {
    try {
      const participantId = parseId(req.params.id);
      if (isNaN(participantId)) {
        return res.status(400).json({ message: "Invalid participant ID" });
      }
      const participant = await storage.getParticipant(participantId);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      res.json(participant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch participant" });
    }
  });
  app2.get("/api/quizzes", async (req, res) => {
    try {
      const includeInactive = req.query.includeInactive === "true" && req.isAuthenticated() && req.user?.isAdmin;
      const quizzes2 = await storage.getAllQuizzes(!!includeInactive);
      res.json(quizzes2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });
  app2.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quizId = parseId(req.params.id);
      if (isNaN(quizId))
        return res.status(400).json({ message: "Invalid quiz ID" });
      const includeInactive = req.query.includeInactive === "true" && req.isAuthenticated() && req.user?.isAdmin;
      const quiz = await storage.getQuiz(quizId, !!includeInactive);
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });
  app2.post("/api/quizzes", isAdmin, async (req, res) => {
    try {
      const validatedData = insertQuizSchema.parse({
        ...req.body,
        creatorId: req.user.id
      });
      const quiz = await storage.createQuiz(validatedData);
      res.status(201).json(quiz);
    } catch (error) {
      if (error instanceof z2.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });
  app2.put("/api/quizzes/:id", isAdmin, async (req, res) => {
    try {
      const quizId = parseId(req.params.id);
      if (isNaN(quizId))
        return res.status(400).json({ message: "Invalid quiz ID" });
      const quiz = await storage.getQuiz(quizId, true);
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });
      const validatedData = insertQuizSchema.partial().parse(req.body);
      const updatedQuiz = await storage.updateQuiz(quizId, validatedData);
      res.json(updatedQuiz);
    } catch (error) {
      if (error instanceof z2.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });
  app2.delete("/api/quizzes/:id", isAdmin, async (req, res) => {
    try {
      const quizId = parseId(req.params.id);
      if (isNaN(quizId))
        return res.status(400).json({ message: "Invalid quiz ID" });
      const success = await storage.deleteQuiz(quizId);
      if (!success) return res.status(404).json({ message: "Quiz not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });
  app2.get("/api/quizzes/:quizId/questions", async (req, res) => {
    try {
      const quizId = parseId(req.params.quizId);
      if (isNaN(quizId))
        return res.status(400).json({ message: "Invalid quiz ID" });
      const questions2 = await storage.getQuestionsByQuizId(quizId);
      res.json(questions2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });
  app2.post("/api/questions", isAdmin, async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z2.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to create question" });
    }
  });
  app2.put("/api/questions/:id", isAdmin, async (req, res) => {
    try {
      const questionId = parseId(req.params.id);
      if (isNaN(questionId))
        return res.status(400).json({ message: "Invalid question ID" });
      const validatedData = insertQuestionSchema.partial().parse(req.body);
      const updatedQuestion = await storage.updateQuestion(
        questionId,
        validatedData
      );
      if (!updatedQuestion)
        return res.status(404).json({ message: "Question not found" });
      res.json(updatedQuestion);
    } catch (error) {
      if (error instanceof z2.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to update question" });
    }
  });
  app2.delete("/api/questions/:id", isAdmin, async (req, res) => {
    try {
      const questionId = parseId(req.params.id);
      if (isNaN(questionId))
        return res.status(400).json({ message: "Invalid question ID" });
      const success = await storage.deleteQuestion(questionId);
      if (!success)
        return res.status(404).json({ message: "Question not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });
  app2.post("/api/quizzes/:quizId/questions/bulk", isAdmin, async (req, res) => {
    try {
      const quizId = parseId(req.params.quizId);
      if (isNaN(quizId))
        return res.status(400).json({ message: "Invalid quiz ID" });
      const quiz = await storage.getQuiz(quizId, true);
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });
      const questionsSchema = z2.array(
        insertQuestionSchema.omit({ quizId: true })
      );
      const validatedQuestions = questionsSchema.parse(req.body);
      const createdQuestions = await storage.createQuestionsBulk(
        validatedQuestions.map((q) => ({ ...q, quizId }))
      );
      res.status(201).json(createdQuestions);
    } catch (error) {
      if (error instanceof z2.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to create questions" });
    }
  });
  app2.put("/api/quizzes/:quizId/questions", isAdmin, async (req, res) => {
    try {
      const quizId = parseId(req.params.quizId);
      if (isNaN(quizId))
        return res.status(400).json({ message: "Invalid quiz ID" });
      const quiz = await storage.getQuiz(quizId, true);
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });
      const questionsSchema = z2.array(
        insertQuestionSchema.omit({ quizId: true })
      );
      const validatedQuestions = questionsSchema.parse(req.body);
      await storage.deleteQuestionsByQuizId(quizId);
      const createdQuestions = await storage.createQuestionsBulk(
        validatedQuestions.map((q) => ({ ...q, quizId }))
      );
      res.json(createdQuestions);
    } catch (error) {
      if (error instanceof z2.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to replace questions" });
    }
  });
  app2.post("/api/results", async (req, res) => {
    try {
      const validatedData = insertResultSchema.parse(req.body);
      const participant = await storage.getParticipant(
        validatedData.participantId
      );
      if (!participant)
        return res.status(404).json({ message: "Participant not found" });
      const quiz = await storage.getQuiz(validatedData.quizId);
      if (!quiz)
        return res.status(404).json({ message: "Quiz not found or inactive" });
      const existingResults = await storage.getResultsByParticipantId(
        validatedData.participantId
      );
      const previousAttempt = existingResults.find(
        (r) => r.quizId === validatedData.quizId
      );
      if (previousAttempt && !previousAttempt.canRetake) {
        return res.status(409).json({ message: "Quiz already completed. Retake not allowed." });
      }
      if (previousAttempt?.canRetake) {
        await storage.updateResultRetake(previousAttempt.id, false);
      }
      const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
      const result = await storage.createResult({
        ...validatedData,
        ipAddress
      });
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z2.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to save result" });
    }
  });
  app2.get("/api/results", isAdmin, async (req, res) => {
    try {
      const sortBy = req.query.sortBy || "date";
      const quizId = req.query.quizId ? parseInt(req.query.quizId) : void 0;
      const results2 = await storage.getAllResults(sortBy, quizId);
      res.json(results2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });
  app2.get("/api/results/check", async (req, res) => {
    try {
      const participantId = parseId(req.query.participantId);
      const quizId = parseId(req.query.quizId);
      if (isNaN(participantId) || isNaN(quizId)) {
        return res.status(400).json({ message: "Invalid participant ID or quiz ID" });
      }
      const results2 = await storage.getResultsByParticipantId(participantId);
      const quizResults = results2.filter((r) => r.quizId === quizId);
      if (quizResults.length === 0) {
        return res.json({ hasTakenQuiz: false, canRetake: true });
      }
      const canRetake = quizResults.some((r) => r.canRetake);
      res.json({ hasTakenQuiz: true, canRetake });
    } catch (error) {
      res.status(500).json({ message: "Failed to check quiz attempt" });
    }
  });
  app2.get("/api/results/:id", async (req, res) => {
    try {
      const resultId = parseId(req.params.id);
      if (isNaN(resultId))
        return res.status(400).json({ message: "Invalid result ID" });
      const result = await storage.getResultWithDetails(resultId);
      if (!result) return res.status(404).json({ message: "Result not found" });
      const isAdminUser = req.isAuthenticated() && req.user?.isAdmin;
      if (!isAdminUser) {
        const requestParticipantId = parseId(req.query.participantId);
        if (isNaN(requestParticipantId) || result.participantId !== requestParticipantId) {
          return res.status(403).json({ message: "Forbidden: you can only view your own results" });
        }
      }
      if (!isAdminUser && result.questions) {
        result.questions = result.questions.map((q) => ({
          ...q,
          correctAnswer: -1
          // hide actual correct answer
        }));
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch result" });
    }
  });
  app2.get("/api/participants/:participantId/results", async (req, res) => {
    try {
      const participantId = parseId(req.params.participantId);
      if (isNaN(participantId))
        return res.status(400).json({ message: "Invalid participant ID" });
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        const storedId = parseId(req.query.self);
        if (isNaN(storedId) || storedId !== participantId) {
          return res.status(403).json({ message: "Forbidden: you can only view your own results" });
        }
      }
      const results2 = await storage.getResultsByParticipantId(participantId);
      res.json(results2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });
  app2.put("/api/results/:id/retake", isAdmin, async (req, res) => {
    try {
      const resultId = parseId(req.params.id);
      if (isNaN(resultId))
        return res.status(400).json({ message: "Invalid result ID" });
      const { canRetake } = req.body;
      if (typeof canRetake !== "boolean") {
        return res.status(400).json({ message: "canRetake must be a boolean value" });
      }
      const updatedResult = await storage.updateResultRetake(
        resultId,
        canRetake
      );
      if (!updatedResult)
        return res.status(404).json({ message: "Result not found" });
      res.json(updatedResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to update retake status" });
    }
  });
  return httpServer;
}

// api-src/index.ts
var app = express();
app.set("trust proxy", true);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
var routesReady = registerRoutes(app);
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});
async function handler(req, res) {
  await routesReady;
  app(req, res);
}
export {
  handler as default
};
