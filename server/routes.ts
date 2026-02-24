import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertParticipantSchema,
  insertQuizSchema,
  insertQuestionSchema,
  insertResultSchema,
} from "@shared/schema";

// RBAC Middleware
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden: admin access required" });
}

/** Parse and validate an integer ID from a string. Returns NaN on failure. */
function parseId(value: string | undefined): number {
  const id = parseInt(value ?? "", 10);
  return Number.isFinite(id) && id > 0 ? id : NaN;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  const httpServer = createServer(app);

  // Participant routes
  app.post("/api/participants", async (req, res) => {
    try {
      const validatedData = insertParticipantSchema.parse(req.body);

      // Return existing participant if roll number already exists
      const existingParticipant = await storage.getParticipantByRollNumber(
        validatedData.rollNumber,
      );
      if (existingParticipant) {
        return res.status(200).json(existingParticipant);
      }

      const participant = await storage.createParticipant(validatedData);
      res.status(201).json(participant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating/finding participant:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Route to search for participants by roll number - must come before the more general route
  app.get("/api/participants/roll/:rollNumber", async (req, res) => {
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

  // General route to get participants by ID
  app.get("/api/participants/:id", async (req, res) => {
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

  // Quiz routes — public reads for active quizzes, admin writes
  app.get("/api/quizzes", async (req, res) => {
    try {
      // Only admins can see inactive quizzes
      const includeInactive =
        req.query.includeInactive === "true" &&
        req.isAuthenticated() &&
        req.user?.isAdmin;
      const quizzes = await storage.getAllQuizzes(!!includeInactive);
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quizId = parseId(req.params.id);
      if (isNaN(quizId))
        return res.status(400).json({ message: "Invalid quiz ID" });

      const includeInactive =
        req.query.includeInactive === "true" &&
        req.isAuthenticated() &&
        req.user?.isAdmin;
      const quiz = await storage.getQuiz(quizId, !!includeInactive);

      if (!quiz) return res.status(404).json({ message: "Quiz not found" });
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.post("/api/quizzes", isAdmin, async (req, res) => {
    try {
      const validatedData = insertQuizSchema.parse({
        ...req.body,
        creatorId: req.user!.id,
      });
      const quiz = await storage.createQuiz(validatedData);
      res.status(201).json(quiz);
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  app.put("/api/quizzes/:id", isAdmin, async (req, res) => {
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
      if (error instanceof z.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });

  app.delete("/api/quizzes/:id", isAdmin, async (req, res) => {
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

  // Question routes — admin only for writes
  app.get("/api/quizzes/:quizId/questions", async (req, res) => {
    try {
      const quizId = parseId(req.params.quizId);
      if (isNaN(quizId))
        return res.status(400).json({ message: "Invalid quiz ID" });
      const questions = await storage.getQuestionsByQuizId(quizId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/questions", isAdmin, async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", isAdmin, async (req, res) => {
    try {
      const questionId = parseId(req.params.id);
      if (isNaN(questionId))
        return res.status(400).json({ message: "Invalid question ID" });

      const validatedData = insertQuestionSchema.partial().parse(req.body);
      const updatedQuestion = await storage.updateQuestion(
        questionId,
        validatedData,
      );
      if (!updatedQuestion)
        return res.status(404).json({ message: "Question not found" });
      res.json(updatedQuestion);
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", isAdmin, async (req, res) => {
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

  // Bulk create questions for a quiz
  app.post("/api/quizzes/:quizId/questions/bulk", isAdmin, async (req, res) => {
    try {
      const quizId = parseId(req.params.quizId);
      if (isNaN(quizId))
        return res.status(400).json({ message: "Invalid quiz ID" });

      const quiz = await storage.getQuiz(quizId, true);
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });

      const questionsSchema = z.array(
        insertQuestionSchema.omit({ quizId: true }),
      );
      const validatedQuestions = questionsSchema.parse(req.body);

      const createdQuestions = await storage.createQuestionsBulk(
        validatedQuestions.map((q) => ({ ...q, quizId })),
      );
      res.status(201).json(createdQuestions);
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to create questions" });
    }
  });

  // Replace all questions for a quiz (delete existing + create new)
  app.put("/api/quizzes/:quizId/questions", isAdmin, async (req, res) => {
    try {
      const quizId = parseId(req.params.quizId);
      if (isNaN(quizId))
        return res.status(400).json({ message: "Invalid quiz ID" });

      const quiz = await storage.getQuiz(quizId, true);
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });

      const questionsSchema = z.array(
        insertQuestionSchema.omit({ quizId: true }),
      );
      const validatedQuestions = questionsSchema.parse(req.body);

      await storage.deleteQuestionsByQuizId(quizId);
      const createdQuestions = await storage.createQuestionsBulk(
        validatedQuestions.map((q) => ({ ...q, quizId })),
      );
      res.json(createdQuestions);
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to replace questions" });
    }
  });

  // Result routes
  app.post("/api/results", async (req, res) => {
    try {
      const validatedData = insertResultSchema.parse(req.body);

      // Validate participant exists
      const participant = await storage.getParticipant(
        validatedData.participantId,
      );
      if (!participant)
        return res.status(404).json({ message: "Participant not found" });

      // Validate quiz exists and is active
      const quiz = await storage.getQuiz(validatedData.quizId);
      if (!quiz)
        return res.status(404).json({ message: "Quiz not found or inactive" });

      // Prevent duplicate submissions
      const existingResults = await storage.getResultsByParticipantId(
        validatedData.participantId,
      );
      const previousAttempt = existingResults.find(
        (r) => r.quizId === validatedData.quizId,
      );
      if (previousAttempt && !previousAttempt.canRetake) {
        return res
          .status(409)
          .json({ message: "Quiz already completed. Retake not allowed." });
      }

      // Reset canRetake flag on previous result when retaking
      if (previousAttempt?.canRetake) {
        await storage.updateResultRetake(previousAttempt.id, false);
      }

      // Capture client IP address
      const ipAddress =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip ||
        "unknown";

      const result = await storage.createResult({
        ...validatedData,
        ipAddress,
      } as any);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Failed to save result" });
    }
  });

  app.get("/api/results", isAdmin, async (req, res) => {
    try {
      const sortBy = (req.query.sortBy as string) || "date";
      const quizId = req.query.quizId
        ? parseInt(req.query.quizId as string)
        : undefined;
      const results = await storage.getAllResults(sortBy, quizId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  // Check if a participant has already taken a quiz (public — participant needs this)
  app.get("/api/results/check", async (req, res) => {
    try {
      const participantId = parseId(req.query.participantId as string);
      const quizId = parseId(req.query.quizId as string);

      if (isNaN(participantId) || isNaN(quizId)) {
        return res
          .status(400)
          .json({ message: "Invalid participant ID or quiz ID" });
      }

      const results = await storage.getResultsByParticipantId(participantId);
      const quizResults = results.filter((r) => r.quizId === quizId);

      if (quizResults.length === 0) {
        return res.json({ hasTakenQuiz: false, canRetake: true });
      }
      const canRetake = quizResults.some((r) => r.canRetake);
      res.json({ hasTakenQuiz: true, canRetake });
    } catch (error) {
      res.status(500).json({ message: "Failed to check quiz attempt" });
    }
  });

  // Result detail — admin can see any result, students can only see their own
  app.get("/api/results/:id", async (req, res) => {
    try {
      const resultId = parseId(req.params.id);
      if (isNaN(resultId))
        return res.status(400).json({ message: "Invalid result ID" });

      const result = await storage.getResultWithDetails(resultId);
      if (!result) return res.status(404).json({ message: "Result not found" });

      // Non-admin requests must own the result (match participantId from query)
      const isAdminUser = req.isAuthenticated() && req.user?.isAdmin;
      if (!isAdminUser) {
        const requestParticipantId = parseId(req.query.participantId as string);
        if (
          isNaN(requestParticipantId) ||
          result.participantId !== requestParticipantId
        ) {
          return res
            .status(403)
            .json({ message: "Forbidden: you can only view your own results" });
        }
      }

      // For students, strip correct answers — only show marks, not solutions
      if (!isAdminUser && result.questions) {
        result.questions = result.questions.map((q) => ({
          ...q,
          correctAnswer: -1, // hide actual correct answer
        }));
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch result" });
    }
  });

  // Participant results — admin can see any, students can only see their own
  app.get("/api/participants/:participantId/results", async (req, res) => {
    try {
      const participantId = parseId(req.params.participantId);
      if (isNaN(participantId))
        return res.status(400).json({ message: "Invalid participant ID" });

      // Non-admin requests must pass a matching participantId
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        const storedId = parseId(req.query.self as string);
        if (isNaN(storedId) || storedId !== participantId) {
          return res
            .status(403)
            .json({ message: "Forbidden: you can only view your own results" });
        }
      }

      const results = await storage.getResultsByParticipantId(participantId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  // Enable/disable retake for a quiz result (admin only)
  app.put("/api/results/:id/retake", isAdmin, async (req, res) => {
    try {
      const resultId = parseId(req.params.id);
      if (isNaN(resultId))
        return res.status(400).json({ message: "Invalid result ID" });

      const { canRetake } = req.body;
      if (typeof canRetake !== "boolean") {
        return res
          .status(400)
          .json({ message: "canRetake must be a boolean value" });
      }

      const updatedResult = await storage.updateResultRetake(
        resultId,
        canRetake,
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
