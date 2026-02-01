import { db } from "@db";
import { users, books, badges, swapRequests } from "@shared/schema";
import type { User, Book, Badge, SwapRequest, InsertSwapRequest } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  createUser(email: string, password: string, name: string, postcode: string): Promise<User>;
  updateUserSubscription(id: string, status: string): Promise<User | undefined>;
  updateStripeCustomerId(id: string, customerId: string): Promise<void>;
  incrementUserSwaps(id: string): Promise<void>;
  verifyPassword(user: User, password: string): Promise<boolean>;
  
  getBooks(postcode?: string): Promise<Book[]>;
  getBook(id: string): Promise<Book | undefined>;
  getUserBooks(userId: string): Promise<Book[]>;
  createBook(data: { title: string; author: string; isbn?: string | null; image?: string | null; description?: string | null; condition?: string; type?: string; postcode: string; ownerId: string; ownerName: string }): Promise<Book>;
  updateBookStatus(id: string, status: string): Promise<void>;
  deleteBook(id: string): Promise<void>;
  
  getUserBadges(userId: string): Promise<Badge[]>;
  createBadge(userId: string, name: string): Promise<Badge>;
  hasBadge(userId: string, name: string): Promise<boolean>;
  
  createSwapRequest(data: InsertSwapRequest): Promise<SwapRequest>;
  getSwapRequest(id: string): Promise<SwapRequest | undefined>;
  getUserSwaps(userId: string): Promise<SwapRequest[]>;
  updateSwapStatus(id: string, status: string): Promise<void>;
  completeSwap(id: string): Promise<void>;
  
  getLeaderboard(postcode: string): Promise<Array<{ user: User; badges: Badge[] }>>;
  getActiveAreas(): Promise<Array<{ postcode: string; bookCount: number; userCount: number }>>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return result[0];
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
    return result[0];
  }

  async createUser(email: string, password: string, name: string, postcode: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      postcode: postcode.toUpperCase(),
    }).returning();
    return result[0];
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async updateUserSubscription(id: string, status: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ subscriptionStatus: status })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateStripeCustomerId(id: string, customerId: string): Promise<void> {
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, id));
  }

  async incrementUserSwaps(id: string): Promise<void> {
    const user = await this.getUserById(id);
    if (user) {
      await db.update(users).set({ swaps: user.swaps + 1 }).where(eq(users.id, id));
    }
  }

  async getBooks(postcode?: string): Promise<Book[]> {
    if (postcode) {
      return await db.select().from(books)
        .where(and(eq(books.postcode, postcode), eq(books.status, "available")))
        .orderBy(desc(books.createdAt));
    }
    return await db.select().from(books).where(eq(books.status, "available")).orderBy(desc(books.createdAt));
  }

  async getBook(id: string): Promise<Book | undefined> {
    const result = await db.select().from(books).where(eq(books.id, id));
    return result[0];
  }

  async getUserBooks(userId: string): Promise<Book[]> {
    return await db.select().from(books).where(eq(books.ownerId, userId)).orderBy(desc(books.createdAt));
  }

  async createBook(data: { title: string; author: string; isbn?: string | null; image?: string | null; description?: string | null; condition?: string; type?: string; postcode: string; ownerId: string; ownerName: string }): Promise<Book> {
    const result = await db.insert(books).values(data).returning();
    return result[0];
  }

  async updateBookStatus(id: string, status: string): Promise<void> {
    await db.update(books).set({ status }).where(eq(books.id, id));
  }

  async deleteBook(id: string): Promise<void> {
    await db.delete(books).where(eq(books.id, id));
  }

  async getUserBadges(userId: string): Promise<Badge[]> {
    return await db.select().from(badges).where(eq(badges.userId, userId));
  }

  async createBadge(userId: string, name: string): Promise<Badge> {
    const result = await db.insert(badges).values({ userId, name }).returning();
    return result[0];
  }

  async hasBadge(userId: string, name: string): Promise<boolean> {
    const result = await db.select().from(badges).where(and(eq(badges.userId, userId), eq(badges.name, name)));
    return result.length > 0;
  }

  async createSwapRequest(data: InsertSwapRequest): Promise<SwapRequest> {
    const result = await db.insert(swapRequests).values(data).returning();
    return result[0];
  }

  async getSwapRequest(id: string): Promise<SwapRequest | undefined> {
    const result = await db.select().from(swapRequests).where(eq(swapRequests.id, id));
    return result[0];
  }

  async getUserSwaps(userId: string): Promise<SwapRequest[]> {
    return await db.select().from(swapRequests)
      .where(eq(swapRequests.requesterId, userId))
      .orderBy(desc(swapRequests.createdAt));
  }

  async updateSwapStatus(id: string, status: string): Promise<void> {
    await db.update(swapRequests).set({ status }).where(eq(swapRequests.id, id));
  }

  async completeSwap(id: string): Promise<void> {
    await db.update(swapRequests).set({ status: "completed", completedAt: new Date() }).where(eq(swapRequests.id, id));
  }

  async getLeaderboard(postcode: string): Promise<Array<{ user: User; badges: Badge[] }>> {
    const postcodeUsers = await db
      .select()
      .from(users)
      .where(eq(users.postcode, postcode))
      .orderBy(desc(users.swaps));

    const leaderboard = await Promise.all(
      postcodeUsers.map(async (user: User) => {
        const userBadges = await this.getUserBadges(user.id);
        return { user, badges: userBadges };
      })
    );

    return leaderboard;
  }

  async getActiveAreas(): Promise<Array<{ postcode: string; bookCount: number; userCount: number }>> {
    const allBooks = await db.select().from(books);
    const allUsers = await db.select().from(users);
    
    const areaStats = new Map<string, { bookCount: number; userCount: number }>();
    
    for (const book of allBooks) {
      const existing = areaStats.get(book.postcode) || { bookCount: 0, userCount: 0 };
      existing.bookCount++;
      areaStats.set(book.postcode, existing);
    }
    
    for (const user of allUsers) {
      const existing = areaStats.get(user.postcode) || { bookCount: 0, userCount: 0 };
      existing.userCount++;
      areaStats.set(user.postcode, existing);
    }
    
    const areas = Array.from(areaStats.entries())
      .map(([postcode, stats]) => ({ postcode, ...stats }))
      .sort((a, b) => b.bookCount - a.bookCount)
      .slice(0, 10);
    
    return areas;
  }
}

export const storage = new DatabaseStorage();
