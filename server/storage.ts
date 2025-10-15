import { db } from "@db";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "@shared/schema";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "@db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<schema.User | undefined>;
  getUserByUsername(username: string): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  
  // Participant methods
  createParticipant(participant: schema.InsertParticipant): Promise<schema.Participant>;
  getParticipant(id: number): Promise<schema.Participant | undefined>;
  getParticipantByRollNumber(rollNumber: string): Promise<schema.Participant | undefined>;
  
  // Quiz methods
  createQuiz(quiz: schema.InsertQuiz): Promise<schema.Quiz>;
  getQuiz(id: number): Promise<schema.Quiz | undefined>;
  getAllQuizzes(): Promise<schema.Quiz[]>;
  updateQuiz(id: number, quiz: Partial<schema.InsertQuiz>): Promise<schema.Quiz | undefined>;
  deleteQuiz(id: number): Promise<boolean>;
  
  // Question methods
  createQuestion(question: schema.InsertQuestion): Promise<schema.Question>;
  getQuestionsByQuizId(quizId: number): Promise<schema.Question[]>;
  updateQuestion(id: number, question: Partial<schema.InsertQuestion>): Promise<schema.Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // Result methods
  createResult(result: schema.InsertResult): Promise<schema.Result>;
  getResult(id: number): Promise<schema.Result | undefined>;
  getResultsByQuizId(quizId: number): Promise<schema.Result[]>;
  getResultsByParticipantId(participantId: number): Promise<schema.Result[]>;
  getResultWithDetails(id: number): Promise<any>;
  getAllResults(sortBy?: string, quizId?: number): Promise<any[]>;
  updateResultRetake(id: number, canRetake: boolean): Promise<schema.Result | undefined>;
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // User methods
  async getUser(id: number): Promise<schema.User | undefined> {
    return await db.query.users.findFirst({
      where: eq(schema.users.id, id)
    });
  }
  
  async getUserByUsername(username: string): Promise<schema.User | undefined> {
    return await db.query.users.findFirst({
      where: eq(schema.users.username, username)
    });
  }
  
  async createUser(user: schema.InsertUser): Promise<schema.User> {
    const [createdUser] = await db.insert(schema.users).values(user).returning();
    return createdUser;
  }
  
  // Participant methods
  async createParticipant(participant: schema.InsertParticipant): Promise<schema.Participant> {
    const [createdParticipant] = await db.insert(schema.participants).values(participant).returning();
    return createdParticipant;
  }
  
  async getParticipant(id: number): Promise<schema.Participant | undefined> {
    return await db.query.participants.findFirst({
      where: eq(schema.participants.id, id)
    });
  }
  
  async getParticipantByRollNumber(rollNumber: string): Promise<schema.Participant | undefined> {
    return await db.query.participants.findFirst({
      where: eq(schema.participants.rollNumber, rollNumber)
    });
  }
  
  // Quiz methods
  async createQuiz(quiz: schema.InsertQuiz): Promise<schema.Quiz> {
    const [createdQuiz] = await db.insert(schema.quizzes).values(quiz).returning();
    return createdQuiz;
  }
  
  async getQuiz(id: number, includeInactive: boolean = false): Promise<schema.Quiz | undefined> {
    return await db.query.quizzes.findFirst({
      where: includeInactive 
        ? eq(schema.quizzes.id, id)
        : and(eq(schema.quizzes.id, id), eq(schema.quizzes.isActive, true)),
      with: {
        questions: true
      }
    });
  }
  
  async getAllQuizzes(includeInactive: boolean = false): Promise<schema.Quiz[]> {
    return await db.query.quizzes.findMany({
      where: includeInactive ? undefined : eq(schema.quizzes.isActive, true),
      orderBy: desc(schema.quizzes.createdAt),
      with: {
        questions: true
      }
    });
  }
  
  async updateQuiz(id: number, quiz: Partial<schema.InsertQuiz>): Promise<schema.Quiz | undefined> {
    const [updatedQuiz] = await db.update(schema.quizzes)
      .set(quiz)
      .where(eq(schema.quizzes.id, id))
      .returning();
    return updatedQuiz;
  }
  
  async deleteQuiz(id: number): Promise<boolean> {
    // Mark quiz as inactive (soft delete) instead of physically deleting it
    const result = await db.update(schema.quizzes)
      .set({ isActive: false })
      .where(eq(schema.quizzes.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Question methods
  async createQuestion(question: schema.InsertQuestion): Promise<schema.Question> {
    const [createdQuestion] = await db.insert(schema.questions).values(question).returning();
    return createdQuestion;
  }
  
  async getQuestionsByQuizId(quizId: number): Promise<schema.Question[]> {
    return await db.query.questions.findMany({
      where: eq(schema.questions.quizId, quizId)
    });
  }
  
  async updateQuestion(id: number, question: Partial<schema.InsertQuestion>): Promise<schema.Question | undefined> {
    const [updatedQuestion] = await db.update(schema.questions)
      .set(question)
      .where(eq(schema.questions.id, id))
      .returning();
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    const result = await db.delete(schema.questions).where(eq(schema.questions.id, id)).returning();
    return result.length > 0;
  }
  
  // Result methods
  async createResult(result: schema.InsertResult): Promise<schema.Result> {
    const [createdResult] = await db.insert(schema.results).values(result).returning();
    return createdResult;
  }
  
  async getResult(id: number): Promise<schema.Result | undefined> {
    return await db.query.results.findFirst({
      where: eq(schema.results.id, id)
    });
  }
  
  async getResultsByQuizId(quizId: number): Promise<schema.Result[]> {
    return await db.query.results.findMany({
      where: eq(schema.results.quizId, quizId),
      orderBy: desc(schema.results.submittedAt)
    });
  }
  
  async getResultsByParticipantId(participantId: number): Promise<schema.Result[]> {
    return await db.query.results.findMany({
      where: eq(schema.results.participantId, participantId),
      orderBy: desc(schema.results.submittedAt)
    });
  }
  
  async getResultWithDetails(id: number): Promise<any> {
    const result = await db.query.results.findFirst({
      where: eq(schema.results.id, id),
      with: {
        participant: true,
        quiz: true
      }
    });
    
    if (!result) return undefined;
    
    // Get questions for this quiz
    const questions = await this.getQuestionsByQuizId(result.quizId);
    
    return {
      ...result,
      questions
    };
  }
  
  async getAllResults(sortBy: string = 'date', quizId?: number): Promise<any[]> {
    let query = db.query.results;
    
    let results = await query.findMany({
      where: quizId ? eq(schema.results.quizId, quizId) : undefined,
      with: {
        participant: true,
        quiz: true
      },
      orderBy: sortBy === 'score' 
        ? desc(schema.results.score) 
        : desc(schema.results.submittedAt)
    });
    
    return results;
  }

  async updateResultRetake(id: number, canRetake: boolean): Promise<schema.Result | undefined> {
    const [updatedResult] = await db.update(schema.results)
      .set({ canRetake })
      .where(eq(schema.results.id, id))
      .returning();
    
    return updatedResult;
  }
}

export const storage = new DatabaseStorage();
