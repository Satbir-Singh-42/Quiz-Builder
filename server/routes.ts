import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertParticipantSchema, insertQuizSchema, insertQuestionSchema, insertResultSchema } from "@shared/schema";

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is an admin
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  const httpServer = createServer(app);

  // Participant routes
  app.post("/api/participants", async (req, res) => {
    try {
      const validatedData = insertParticipantSchema.parse(req.body);
      
      // First check if a participant with the same roll number already exists
      console.log(`Checking for existing participant with roll number: ${validatedData.rollNumber}`);
      const existingParticipant = await storage.getParticipantByRollNumber(validatedData.rollNumber);
      
      if (existingParticipant) {
        console.log(`Found existing participant: ${existingParticipant.id}`);
        // Return the existing participant if found
        return res.status(200).json(existingParticipant);
      }
      
      // If no existing participant, create a new one
      console.log(`Creating new participant with roll number: ${validatedData.rollNumber}`);
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
      console.log(`Searching for participant with roll number: ${rollNumber}`);
      
      const participant = await storage.getParticipantByRollNumber(rollNumber);
      
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      res.json(participant);
    } catch (error) {
      console.error("Error fetching participant by roll number:", error);
      res.status(500).json({ message: "Failed to fetch participant" });
    }
  });

  // General route to get participants by ID
  app.get("/api/participants/:id", async (req, res) => {
    try {
      const participantId = parseInt(req.params.id);
      
      if (isNaN(participantId)) {
        return res.status(400).json({ message: "Invalid participant ID" });
      }
      
      const participant = await storage.getParticipant(participantId);
      
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      res.json(participant);
    } catch (error) {
      console.error("Error fetching participant:", error);
      res.status(500).json({ message: "Failed to fetch participant" });
    }
  });
  
  // Quiz routes
  app.get("/api/quizzes", async (req, res) => {
    try {
      console.log("Fetching all quizzes");
      const includeInactive = req.query.includeInactive === 'true';
      const quizzes = await storage.getAllQuizzes(includeInactive);
      console.log(`Found ${quizzes.length} quizzes`);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });
  
  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const includeInactive = req.query.includeInactive === 'true';
      console.log(`Fetching quiz id: ${quizId}, includeInactive: ${includeInactive}`);
      const quiz = await storage.getQuiz(quizId, includeInactive);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });
  
  app.post("/api/quizzes", isAdmin, async (req, res) => {
    try {
      // Use non-null assertion since isAdmin middleware guarantees req.user exists
      const validatedData = insertQuizSchema.parse({
        ...req.body,
        creatorId: req.user!.id
      });
      
      const quiz = await storage.createQuiz(validatedData);
      res.status(201).json(quiz);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });
  
  app.put("/api/quizzes/:id", isAdmin, async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      // Admin should be able to update inactive quizzes too
      const quiz = await storage.getQuiz(quizId, true);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      const updatedQuiz = await storage.updateQuiz(quizId, req.body);
      res.json(updatedQuiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });
  
  app.delete("/api/quizzes/:id", isAdmin, async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const success = await storage.deleteQuiz(quizId);
      
      if (!success) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });
  
  // Question routes
  app.get("/api/quizzes/:quizId/questions", async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create question" });
    }
  });
  
  app.put("/api/questions/:id", isAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const updatedQuestion = await storage.updateQuestion(questionId, req.body);
      
      if (!updatedQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json(updatedQuestion);
    } catch (error) {
      res.status(500).json({ message: "Failed to update question" });
    }
  });
  
  app.delete("/api/questions/:id", isAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const success = await storage.deleteQuestion(questionId);
      
      if (!success) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });
  
  // Result routes
  app.post("/api/results", async (req, res) => {
    try {
      const validatedData = insertResultSchema.parse(req.body);
      const result = await storage.createResult(validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save result" });
    }
  });
  
  app.get("/api/results", isAdmin, async (req, res) => {
    try {
      const sortBy = req.query.sortBy as string || 'date';
      const quizId = req.query.quizId ? parseInt(req.query.quizId as string) : undefined;
      
      const results = await storage.getAllResults(sortBy, quizId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });
  
  // Check if a participant has already taken a quiz
  app.get("/api/results/check", async (req, res) => {
    try {
      const participantId = parseInt(req.query.participantId as string);
      const quizId = parseInt(req.query.quizId as string);
      
      if (isNaN(participantId) || isNaN(quizId)) {
        return res.status(400).json({ message: "Invalid participant ID or quiz ID" });
      }
      
      const results = await storage.getResultsByParticipantId(participantId);
      
      // Check if the participant has taken the quiz and cannot retake it
      // A participant can retake if:
      // 1. They never took the quiz before, OR
      // 2. They took it before but the result has canRetake set to true
      const quizResults = results.filter(result => result.quizId === quizId);
      
      if (quizResults.length === 0) {
        // Never taken before
        res.json({ hasTakenQuiz: false, canRetake: true });
      } else {
        // Check if any of the results have canRetake set to true
        const canRetake = quizResults.some(result => result.canRetake);
        res.json({ hasTakenQuiz: true, canRetake });
      }
    } catch (error) {
      console.error("Error checking quiz attempt:", error);
      res.status(500).json({ message: "Failed to check quiz attempt" });
    }
  });
  
  app.get("/api/results/:id", async (req, res) => {
    try {
      const resultId = parseInt(req.params.id);
      const result = await storage.getResultWithDetails(resultId);
      
      if (!result) {
        return res.status(404).json({ message: "Result not found" });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch result" });
    }
  });
  
  app.get("/api/participants/:participantId/results", async (req, res) => {
    try {
      const participantId = parseInt(req.params.participantId);
      const results = await storage.getResultsByParticipantId(participantId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  // Enable/disable retake for a quiz result
  app.put("/api/results/:id/retake", isAdmin, async (req, res) => {
    try {
      const resultId = parseInt(req.params.id);
      const { canRetake } = req.body;
      
      if (typeof canRetake !== 'boolean') {
        return res.status(400).json({ message: "canRetake must be a boolean value" });
      }
      
      const updatedResult = await storage.updateResultRetake(resultId, canRetake);
      
      if (!updatedResult) {
        return res.status(404).json({ message: "Result not found" });
      }
      
      res.json(updatedResult);
    } catch (error) {
      console.error("Error updating retake status:", error);
      res.status(500).json({ message: "Failed to update retake status" });
    }
  });

  return httpServer;
}
