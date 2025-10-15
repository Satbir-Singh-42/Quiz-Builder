import "dotenv/config";
import { db } from "./index";
import * as schema from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Starting database seed...");

    // Create admin user
    const adminExists = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "admin")
    });

    if (!adminExists) {
      const adminUser = await db.insert(schema.users)
        .values({
          username: "admin",
          password: await hashPassword("admin123"),
          isAdmin: true
        })
        .returning();
      console.log("Admin user created:", adminUser[0].username);
    } else {
      console.log("Admin user already exists, skipping creation");
    }

    // Seed sample quizzes if none exist
    const existingQuizzes = await db.query.quizzes.findMany({
      limit: 1
    });

    if (existingQuizzes.length === 0) {
      // Get admin user id
      const admin = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, "admin")
      });

      if (!admin) {
        throw new Error("Admin user not found");
      }

      // Create JavaScript quiz
      const jsQuiz = await db.insert(schema.quizzes)
        .values({
          title: "Introduction to JavaScript",
          timeLimit: 30,
          passingScore: 70,
          creatorId: admin.id
        })
        .returning();
      console.log("Created quiz:", jsQuiz[0].title);

      // Add questions
      const jsQuestions = [
        {
          text: "What is the correct way to declare a JavaScript variable?",
          options: [
            "var myVariable = 10;",
            "variable myVariable = 10;",
            "v myVariable = 10;",
            "const myVariable := 10;"
          ],
          correctAnswer: 0
        },
        {
          text: "Which of the following is NOT a JavaScript data type?",
          options: [
            "String",
            "Boolean",
            "Character",
            "Undefined"
          ],
          correctAnswer: 2
        },
        {
          text: "How do you write a comment in JavaScript?",
          options: [
            "// This is a comment",
            "<!-- This is a comment -->",
            "/* This is a comment */",
            "Both A and C are correct"
          ],
          correctAnswer: 3
        }
      ];
      
      for (const q of jsQuestions) {
        await db.insert(schema.questions)
          .values({
            quizId: jsQuiz[0].id,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer
          });
      }
      
      // Create Database quiz
      const dbQuiz = await db.insert(schema.quizzes)
        .values({
          title: "Database Management Systems",
          timeLimit: 25,
          passingScore: 60,
          creatorId: admin.id
        })
        .returning();
      console.log("Created quiz:", dbQuiz[0].title);
      
      // Add questions
      const dbQuestions = [
        {
          text: "What does SQL stand for?",
          options: [
            "Structured Query Language",
            "Simple Query Language",
            "Standard Query Language",
            "System Query Language"
          ],
          correctAnswer: 0
        },
        {
          text: "Which of the following is not a valid SQL command?",
          options: [
            "SELECT",
            "CONNECT",
            "UPDATE",
            "DELETE"
          ],
          correctAnswer: 1
        }
      ];
      
      for (const q of dbQuestions) {
        await db.insert(schema.questions)
          .values({
            quizId: dbQuiz[0].id,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer
          });
      }
      
      // Create Data Structures quiz
      const dsQuiz = await db.insert(schema.quizzes)
        .values({
          title: "Data Structures",
          timeLimit: 45,
          passingScore: 65,
          creatorId: admin.id
        })
        .returning();
      console.log("Created quiz:", dsQuiz[0].title);
      
      // Add questions
      const dsQuestions = [
        {
          text: "Which data structure uses LIFO order?",
          options: [
            "Queue",
            "Stack",
            "Linked List",
            "Tree"
          ],
          correctAnswer: 1
        },
        {
          text: "What is the time complexity of binary search?",
          options: [
            "O(1)",
            "O(n)",
            "O(log n)",
            "O(n²)"
          ],
          correctAnswer: 2
        }
      ];
      
      for (const q of dsQuestions) {
        await db.insert(schema.questions)
          .values({
            quizId: dsQuiz[0].id,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer
          });
      }
      
      console.log("Sample quizzes and questions created successfully");
    } else {
      console.log("Quizzes already exist, skipping sample data creation");
    }

    console.log("Database seed completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
