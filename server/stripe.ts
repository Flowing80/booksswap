import Stripe from "stripe";
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import { sendTrialEndingEmail } from "./email";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

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

export function registerStripeRoutes(app: Express) {
  if (!stripe) {
    console.log("⚠️ Stripe not configured - payment features disabled");
    app.post("/api/stripe/create-checkout-session", (req, res) => {
      res.status(503).json({ error: "Payment system not configured" });
    });
    app.post("/api/stripe/cancel-subscription", (req, res) => {
      res.status(503).json({ error: "Payment system not configured" });
    });
    app.get("/api/stripe/subscription-status", (req, res) => {
      res.status(503).json({ error: "Payment system not configured" });
    });
    return;
  }

  app.post("/api/stripe/create-checkout-session", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customerId);
      }

      const priceId = process.env.STRIPE_PRICE_ID;
      if (!priceId) {
        return res.status(500).json({ error: "Stripe price not configured" });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        subscription_data: {
          trial_period_days: 7,
        },
        success_url: `${process.env.FRONTEND_URL || "http://localhost:5000"}/?success=true`,
        cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5000"}/?canceled=true`,
        metadata: { userId: user.id },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ error: "Error creating checkout session" });
    }
  });

  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ error: "Missing signature or webhook secret" });
    }

    try {
      const rawBody = (req as any).rawBody;
      if (!rawBody) {
        console.error("Webhook error: No raw body available");
        return res.status(400).json({ error: "No raw body" });
      }

      const event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          if (userId) {
            // Set to active - covers both trial and paid subscriptions
            await storage.updateUserSubscription(userId, "active");
            console.log(`✅ Subscription activated for user ${userId}`);
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          const user = await findUserByStripeCustomerId(customerId);
          if (user) {
            await storage.updateUserSubscription(user.id, "canceled");
            console.log(`❌ Subscription canceled for user ${user.id}`);
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          const user = await findUserByStripeCustomerId(customerId);
          if (user) {
            let status = "active";
            if (subscription.status === "canceled" || subscription.cancel_at_period_end) {
              status = "canceled";
            } else if (subscription.status === "unpaid" || subscription.status === "past_due") {
              status = "inactive";
            } else if (subscription.status === "active") {
              status = "active";
            }
            await storage.updateUserSubscription(user.id, status);
            console.log(`🔄 Subscription status updated to ${status} for user ${user.id}`);
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          
          const user = await findUserByStripeCustomerId(customerId);
          if (user) {
            await storage.updateUserSubscription(user.id, "inactive");
            console.log(`⚠️ Payment failed for user ${user.id}`);
          }
          break;
        }

        case "customer.subscription.trial_will_end": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          const user = await findUserByStripeCustomerId(customerId);
          if (user) {
            const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
            await sendTrialEndingEmail(user.email, user.name, trialEnd);
            console.log(`📧 Trial ending email sent to user ${user.id}`);
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Webhook error" });
    }
  });

  app.post("/api/stripe/cancel-subscription", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ error: "No subscription found" });
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "active",
      });

      if (subscriptions.data.length > 0) {
        await stripe.subscriptions.cancel(subscriptions.data[0].id);
        await storage.updateUserSubscription(user.id, "canceled");
        res.json({ message: "Subscription cancelled" });
      } else {
        res.status(404).json({ error: "No active subscription found" });
      }
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Error cancelling subscription" });
    }
  });

  app.get("/api/stripe/subscription-status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ 
        status: user.subscriptionStatus,
        isActive: user.subscriptionStatus === "active"
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching subscription status" });
    }
  });
}

async function findUserByStripeCustomerId(customerId: string): Promise<{ id: string; email: string; name: string } | null> {
  const result = await storage.getUserByStripeCustomerId(customerId);
  return result || null;
}
