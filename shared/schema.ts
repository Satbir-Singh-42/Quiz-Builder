import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { QUIZ_DEFAULTS, VALIDATION, AUTH } from "./constants";

// Users/admins table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    isAdmin: true,
  })
  .extend({
    username: z
      .string()
      .min(
        AUTH.MIN_USERNAME_LENGTH,
        `Username must be at least ${AUTH.MIN_USERNAME_LENGTH} characters`,
      ),
    password: z
      .string()
      .min(
        AUTH.MIN_PASSWORD_LENGTH,
        `Password must be at least ${AUTH.MIN_PASSWORD_LENGTH} characters`,
      ),
  });

// Quiz participants table
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  rollNumber: text("roll_number").notNull().unique(),
  class: text("class").notNull(),
  department: text("department").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertParticipantSchema = createInsertSchema(participants)
  .pick({
    fullName: true,
    rollNumber: true,
    class: true,
    department: true,
  })
  .extend({
    fullName: z
      .string()
      .min(
        VALIDATION.MIN_NAME_LENGTH,
        `Name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`,
      ),
    rollNumber: z.string().min(1, "Roll number is required"),
    class: z.string().min(1, "Year is required"),
    department: z.string().min(1, "Department is required"),
  });

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  timeLimit: integer("time_limit").notNull(), // in minutes
  passingScore: integer("passing_score")
    .default(QUIZ_DEFAULTS.DEFAULT_PASSING_SCORE)
    .notNull(),
  creatorId: integer("creator_id")
    .references(() => users.id)
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertQuizSchema = createInsertSchema(quizzes)
  .pick({
    title: true,
    description: true,
    timeLimit: true,
    passingScore: true,
    creatorId: true,
    isActive: true,
    password: true,
  })
  .extend({
    title: z
      .string()
      .min(
        VALIDATION.MIN_QUIZ_TITLE_LENGTH,
        `Title must be at least ${VALIDATION.MIN_QUIZ_TITLE_LENGTH} characters`,
      ),
    description: z.string().nullish(),
    timeLimit: z.coerce.number().int().positive("Time limit must be positive"),
    passingScore: z.coerce
      .number()
      .int()
      .min(1, "Min 1%")
      .max(100, "Max 100%")
      .default(QUIZ_DEFAULTS.DEFAULT_PASSING_SCORE),
  });

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id")
    .references(() => quizzes.id)
    .notNull(),
  text: text("text").notNull(),
  options: json("options").$type<string[]>().notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuestionSchema = createInsertSchema(questions)
  .pick({
    quizId: true,
    text: true,
    options: true,
    correctAnswer: true,
  })
  .extend({
    text: z
      .string()
      .min(
        VALIDATION.MIN_QUESTION_LENGTH,
        `Question must be at least ${VALIDATION.MIN_QUESTION_LENGTH} characters`,
      ),
    options: z
      .array(z.string().min(1, "Option cannot be empty"))
      .min(
        QUIZ_DEFAULTS.MIN_OPTIONS,
        `At least ${QUIZ_DEFAULTS.MIN_OPTIONS} options required`,
      ),
    correctAnswer: z.number().int().min(0),
  });

// Quiz results table
export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id")
    .references(() => participants.id)
    .notNull(),
  quizId: integer("quiz_id")
    .references(() => quizzes.id)
    .notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  timeTaken: integer("time_taken").notNull(), // in seconds
  answers: json("answers")
    .$type<{ questionId: number; selectedAnswer: number }[]>()
    .notNull(),
  canRetake: boolean("can_retake").default(false).notNull(),
  ipAddress: text("ip_address"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertResultSchema = createInsertSchema(results)
  .pick({
    participantId: true,
    quizId: true,
    score: true,
    totalQuestions: true,
    timeTaken: true,
    answers: true,
    canRetake: true,
  })
  .extend({
    score: z.number().int().min(0),
    totalQuestions: z.number().int().positive(),
    timeTaken: z.number().int().min(0),
    answers: z.array(
      z.object({
        questionId: z.number(),
        selectedAnswer: z.number(),
      }),
    ),
  });

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  createdQuizzes: many(quizzes),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  creator: one(users, { fields: [quizzes.creatorId], references: [users.id] }),
  questions: many(questions),
  results: many(results),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, { fields: [questions.quizId], references: [quizzes.id] }),
}));

export const participantsRelations = relations(participants, ({ many }) => ({
  results: many(results),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  participant: one(participants, {
    fields: [results.participantId],
    references: [participants.id],
  }),
  quiz: one(quizzes, { fields: [results.quizId], references: [quizzes.id] }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Result = typeof results.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;

// Composite types for API responses
export type ResultWithDetails = Result & {
  participant: Participant;
  quiz: Quiz;
  questions?: Question[];
};

export type QuizWithQuestions = Quiz & {
  questions: Question[];
};
