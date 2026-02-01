import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "hello@booksswap.co.uk";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.log("⚠️ SendGrid not configured - skipping email:", options.subject);
    return false;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: FROM_EMAIL,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });
    console.log(`✅ Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return false;
  }
}

export async function sendSwapRequestEmail(
  ownerEmail: string,
  ownerName: string,
  requesterName: string,
  bookTitle: string
): Promise<boolean> {
  return sendEmail({
    to: ownerEmail,
    subject: `New swap request for "${bookTitle}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">📚 New Swap Request!</h2>
        <p>Hi ${ownerName},</p>
        <p><strong>${requesterName}</strong> wants to swap for your book "<strong>${bookTitle}</strong>".</p>
        <p>Log in to BooksSwap to accept or reject this request.</p>
        <p style="margin-top: 24px;">
          <a href="${process.env.APP_URL || 'https://booksswap.app'}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View Request</a>
        </p>
        <p style="color: #666; margin-top: 32px; font-size: 14px;">— The BooksSwap Team</p>
      </div>
    `,
  });
}

export async function sendSwapAcceptedEmail(
  requesterEmail: string,
  requesterName: string,
  ownerName: string,
  bookTitle: string
): Promise<boolean> {
  return sendEmail({
    to: requesterEmail,
    subject: `Your swap request was accepted! 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">🎉 Great News!</h2>
        <p>Hi ${requesterName},</p>
        <p><strong>${ownerName}</strong> has accepted your swap request for "<strong>${bookTitle}</strong>"!</p>
        <p>You can now arrange to meet up and complete the swap.</p>
        <h3 style="color: #666;">Safety Reminders:</h3>
        <ul style="color: #666;">
          <li>Meet in a public place</li>
          <li>During daylight hours</li>
          <li>Let someone know where you're going</li>
        </ul>
        <p style="margin-top: 24px;">
          <a href="${process.env.APP_URL || 'https://booksswap.app'}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View Details</a>
        </p>
        <p style="color: #666; margin-top: 32px; font-size: 14px;">— The BooksSwap Team</p>
      </div>
    `,
  });
}

export async function sendSwapRejectedEmail(
  requesterEmail: string,
  requesterName: string,
  bookTitle: string
): Promise<boolean> {
  return sendEmail({
    to: requesterEmail,
    subject: `Update on your swap request`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #666;">Swap Request Update</h2>
        <p>Hi ${requesterName},</p>
        <p>Unfortunately, the swap request for "<strong>${bookTitle}</strong>" was not accepted this time.</p>
        <p>Don't worry — there are plenty of other books available in your area!</p>
        <p style="margin-top: 24px;">
          <a href="${process.env.APP_URL || 'https://booksswap.app'}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Browse Books</a>
        </p>
        <p style="color: #666; margin-top: 32px; font-size: 14px;">— The BooksSwap Team</p>
      </div>
    `,
  });
}

export async function sendSwapCompletedEmail(
  email: string,
  name: string,
  bookTitle: string,
  badgeEarned?: string
): Promise<boolean> {
  const badgeSection = badgeEarned
    ? `<p style="background: #fef3c7; padding: 12px; border-radius: 8px;">🏆 <strong>Badge earned:</strong> ${badgeEarned}</p>`
    : "";

  return sendEmail({
    to: email,
    subject: `Swap completed! 📚`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">✅ Swap Completed!</h2>
        <p>Hi ${name},</p>
        <p>Your swap for "<strong>${bookTitle}</strong>" has been marked as complete.</p>
        ${badgeSection}
        <p>Thanks for being part of the BooksSwap community!</p>
        <p style="margin-top: 24px;">
          <a href="${process.env.APP_URL || 'https://booksswap.app'}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Find More Books</a>
        </p>
        <p style="color: #666; margin-top: 32px; font-size: 14px;">— The BooksSwap Team</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Welcome to BooksSwap! 📚`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Welcome to BooksSwap! 📚</h2>
        <p>Hi ${name},</p>
        <p>Thanks for joining our community of book lovers!</p>
        <p>With BooksSwap, you can:</p>
        <ul>
          <li>Share books you've finished reading</li>
          <li>Find new books from neighbours in your postcode</li>
          <li>Earn badges as you swap more books</li>
        </ul>
        <p><strong>Next step:</strong> Start your free 7-day trial to upload and swap unlimited books. After the trial, it's just £0.50/month — cancel anytime with no charge.</p>
        <p style="margin-top: 24px;">
          <a href="${process.env.APP_URL || 'https://booksswap.app'}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Start Free Trial</a>
        </p>
        <p style="color: #666; margin-top: 32px; font-size: 14px;">— The BooksSwap Team</p>
      </div>
    `,
  });
}

export async function sendTrialEndingEmail(
  email: string,
  name: string,
  trialEndDate: Date | null
): Promise<boolean> {
  const dateStr = trialEndDate 
    ? trialEndDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'in 2 days';

  return sendEmail({
    to: email,
    subject: `Your BooksSwap free trial ends soon`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Your Free Trial Ends Soon</h2>
        <p>Hi ${name},</p>
        <p>Just a heads up — your 7-day free trial ends on <strong>${dateStr}</strong>.</p>
        <p>After your trial, you'll be charged just <strong>£0.50/month</strong> to continue swapping books with your local community.</p>
        <h3 style="color: #666;">What happens next?</h3>
        <ul style="color: #666;">
          <li>Your subscription will start automatically</li>
          <li>You can cancel anytime with no charge</li>
          <li>All your books and swap history will be kept</li>
        </ul>
        <p>If you'd like to cancel before your trial ends, you can do so from your dashboard — no questions asked!</p>
        <p style="margin-top: 24px;">
          <a href="${process.env.APP_URL || 'https://booksswap.app'}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Manage Subscription</a>
        </p>
        <p style="color: #666; margin-top: 32px; font-size: 14px;">— The BooksSwap Team</p>
      </div>
    `,
  });
}
