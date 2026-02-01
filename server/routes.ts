import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerUserSchema, loginUserSchema, insertBookSchema } from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import {
  sendWelcomeEmail,
  sendSwapRequestEmail,
  sendSwapAcceptedEmail,
  sendSwapRejectedEmail,
  sendSwapCompletedEmail,
} from "./email";

const JWT_SECRET = process.env.JWT_SECRET || "booksswap-secret-key-change-in-production";

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

async function requireSubscription(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const user = await storage.getUserById(req.user.id);
  if (!user || (user.subscriptionStatus !== "active" && user.subscriptionStatus !== "trialing")) {
    return res.status(403).json({ error: "Active subscription required" });
  }
  
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, postcode } = registerUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const user = await storage.createUser(email, password, name, postcode);
      
      // Send welcome email (async, don't block)
      sendWelcomeEmail(email, name).catch(console.error);
      
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          postcode: user.postcode,
          subscriptionStatus: user.subscriptionStatus,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid registration data", details: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Error creating account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginUserSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await storage.verifyPassword(user, password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          postcode: user.postcode,
          subscriptionStatus: user.subscriptionStatus,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid login data" });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Error logging in" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        postcode: user.postcode,
        subscriptionStatus: user.subscriptionStatus,
        swaps: user.swaps,
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching user" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user.id,
      name: user.name,
      postcode: user.postcode,
      subscriptionStatus: user.subscriptionStatus,
      swaps: user.swaps,
    });
  });

  app.get("/api/users/:id/badges", async (req, res) => {
    const badges = await storage.getUserBadges(req.params.id);
    res.json(badges);
  });

  // Book routes
  app.get("/api/books", async (req, res) => {
    const postcode = req.query.postcode as string | undefined;
    const books = await storage.getBooks(postcode);
    res.json(books);
  });

  app.get("/api/books/:id", async (req, res) => {
    const book = await storage.getBook(req.params.id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json(book);
  });

  app.get("/api/my-books", authenticateToken, async (req: AuthRequest, res) => {
    const books = await storage.getUserBooks(req.user!.id);
    res.json(books);
  });

  app.post("/api/books", authenticateToken, requireSubscription, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const bookData = insertBookSchema.parse({
        ...req.body,
        ownerId: user.id,
        ownerName: user.name,
        postcode: user.postcode,
      });

      const book = await storage.createBook(bookData);
      
      // Award badges
      const userBooks = await storage.getUserBooks(user.id);
      if (userBooks.length === 1 && !(await storage.hasBadge(user.id, "Book Uploader"))) {
        await storage.createBadge(user.id, "Book Uploader");
      }
      if (userBooks.length >= 5 && !(await storage.hasBadge(user.id, "5 Books"))) {
        await storage.createBadge(user.id, "5 Books");
      }
      if (userBooks.length >= 10 && !(await storage.hasBadge(user.id, "10 Books"))) {
        await storage.createBadge(user.id, "10 Books");
      }
      
      res.status(201).json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid book data", details: error.errors });
      }
      console.error("Error adding book:", error);
      res.status(500).json({ error: "Error adding book" });
    }
  });

  app.delete("/api/books/:id", authenticateToken, async (req: AuthRequest, res) => {
    const bookId = req.params.id as string;
    const book = await storage.getBook(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    if (book.ownerId !== req.user!.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    await storage.deleteBook(bookId);
    res.json({ success: true });
  });

  // Swap routes
  app.post("/api/swaps/request", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { bookId } = z.object({ bookId: z.string() }).parse(req.body);
      
      const book = await storage.getBook(bookId);
      if (!book || book.status !== "available") {
        return res.status(404).json({ error: "Book not available" });
      }
      
      if (book.ownerId === req.user!.id) {
        return res.status(400).json({ error: "Cannot request your own book" });
      }

      const requester = await storage.getUserById(req.user!.id);
      const owner = await storage.getUserById(book.ownerId);
      
      const swap = await storage.createSwapRequest({
        bookId,
        requesterId: req.user!.id,
        ownerId: book.ownerId,
      });

      await storage.updateBookStatus(bookId, "pending");

      // Send email notification to book owner
      if (owner?.email && requester) {
        sendSwapRequestEmail(owner.email, owner.name, requester.name, book.title).catch(console.error);
      }

      res.status(201).json(swap);
    } catch (error) {
      console.error("Error creating swap:", error);
      res.status(500).json({ error: "Error creating swap request" });
    }
  });

  app.get("/api/swaps/incoming", authenticateToken, async (req: AuthRequest, res) => {
    const user = await storage.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get all swaps where user is the owner
    const allSwaps = await storage.getUserSwaps(req.user!.id);
    res.json(allSwaps);
  });

  app.post("/api/swaps/:id/accept", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const swapId = req.params.id as string;
      const swap = await storage.getSwapRequest(swapId);
      if (!swap) {
        return res.status(404).json({ error: "Swap not found" });
      }
      
      if (swap.ownerId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.updateSwapStatus(swap.id, "accepted");

      // Send email notification to requester
      const requester = await storage.getUserById(swap.requesterId);
      const owner = await storage.getUserById(swap.ownerId);
      const book = await storage.getBook(swap.bookId);
      if (requester?.email && owner && book) {
        sendSwapAcceptedEmail(requester.email, requester.name, owner.name, book.title).catch(console.error);
      }

      res.json({ message: "Swap accepted" });
    } catch (error) {
      console.error("Error accepting swap:", error);
      res.status(500).json({ error: "Error accepting swap" });
    }
  });

  app.post("/api/swaps/:id/reject", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const swapId = req.params.id as string;
      const swap = await storage.getSwapRequest(swapId);
      if (!swap) {
        return res.status(404).json({ error: "Swap not found" });
      }
      
      if (swap.ownerId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.updateSwapStatus(swap.id, "rejected");
      await storage.updateBookStatus(swap.bookId, "available");

      // Send email notification to requester
      const requester = await storage.getUserById(swap.requesterId);
      const book = await storage.getBook(swap.bookId);
      if (requester?.email && book) {
        sendSwapRejectedEmail(requester.email, requester.name, book.title).catch(console.error);
      }

      res.json({ message: "Swap rejected" });
    } catch (error) {
      console.error("Error rejecting swap:", error);
      res.status(500).json({ error: "Error rejecting swap" });
    }
  });

  app.post("/api/swaps/:id/complete", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const swapId = req.params.id as string;
      const swap = await storage.getSwapRequest(swapId);
      if (!swap) {
        return res.status(404).json({ error: "Swap not found" });
      }
      
      if (swap.ownerId !== req.user!.id && swap.requesterId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.completeSwap(swap.id);
      await storage.updateBookStatus(swap.bookId, "swapped");
      
      // Increment swap counts
      await storage.incrementUserSwaps(swap.requesterId);
      await storage.incrementUserSwaps(swap.ownerId);

      // Award swap badges
      const requester = await storage.getUserById(swap.requesterId);
      const owner = await storage.getUserById(swap.ownerId);

      const book = await storage.getBook(swap.bookId);
      const badgesEarned: Record<string, string | undefined> = {};

      for (const user of [requester, owner]) {
        if (user) {
          if (user.swaps >= 1 && !(await storage.hasBadge(user.id, "First Swap"))) {
            await storage.createBadge(user.id, "First Swap");
            badgesEarned[user.id] = "First Swap";
          }
          if (user.swaps >= 5 && !(await storage.hasBadge(user.id, "5 Swaps"))) {
            await storage.createBadge(user.id, "5 Swaps");
            badgesEarned[user.id] = "5 Swaps";
          }
          if (user.swaps >= 10 && !(await storage.hasBadge(user.id, "10 Swaps"))) {
            await storage.createBadge(user.id, "10 Swaps");
            badgesEarned[user.id] = "10 Swaps";
          }
          
          // Send completion email
          if (user.email && book) {
            sendSwapCompletedEmail(user.email, user.name, book.title, badgesEarned[user.id]).catch(console.error);
          }
        }
      }

      res.json({ message: "Swap completed" });
    } catch (error) {
      console.error("Error completing swap:", error);
      res.status(500).json({ error: "Error completing swap" });
    }
  });

  // Leaderboard route
  app.get("/api/leaderboard/:postcode", async (req, res) => {
    const leaderboard = await storage.getLeaderboard(req.params.postcode);
    res.json(leaderboard);
  });

  // Active areas route
  app.get("/api/active-areas", async (req, res) => {
    const areas = await storage.getActiveAreas();
    res.json(areas);
  });

  // Dashboard stats
  app.get("/api/dashboard", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const books = await storage.getUserBooks(user.id);
      const badges = await storage.getUserBadges(user.id);

      res.json({
        booksUploaded: books.length,
        swapsCompleted: user.swaps,
        badgesEarned: badges.length,
        badges,
        subscriptionStatus: user.subscriptionStatus,
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching dashboard" });
    }
  });

  return httpServer;
}
