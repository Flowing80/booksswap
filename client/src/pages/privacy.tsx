import { BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/95 backdrop-blur">
        <div className="container-narrow section-padding">
          <div className="flex h-16 items-center">
            <Link href="/">
              <a className="flex items-center gap-2">
                <BookOpen className="size-6 text-primary" />
                <span className="font-display text-lg font-semibold">BooksSwap</span>
              </a>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container-narrow section-padding py-12">
        <h1 className="font-display text-3xl font-semibold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: January 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">When you use BooksSwap, we collect:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account information:</strong> Your name, email address, and postcode when you register.</li>
              <li><strong>Book listings:</strong> Information about books you upload including title, author, condition, and description.</li>
              <li><strong>Swap activity:</strong> Records of swap requests you send and receive.</li>
              <li><strong>Payment information:</strong> Subscription and payment details processed securely through Stripe.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide and improve our book swapping service</li>
              <li>Match you with book owners in your postcode area</li>
              <li>Send you notifications about swap requests and updates</li>
              <li>Process subscription payments</li>
              <li>Award badges and track your swap achievements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">3. Information Sharing</h2>
            <p className="text-muted-foreground mb-4">
              We do not sell your personal information. We share limited information only when necessary:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>With other users:</strong> Your name and postcode are visible to users browsing books in your area. Your email is never shared publicly.</li>
              <li><strong>Service providers:</strong> We use Stripe for payments and SendGrid for emails. These services have their own privacy policies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Data Security</h2>
            <p className="text-muted-foreground">
              We protect your data using industry-standard security measures including encrypted passwords, 
              secure HTTPS connections, and secure payment processing through Stripe. We never store your 
              full payment card details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Cancel your subscription at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or your data, please contact us at the email 
              address provided when you registered.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container-narrow section-padding">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link href="/"><a className="hover:text-foreground">Home</a></Link>
            <Link href="/privacy"><a className="hover:text-foreground">Privacy Policy</a></Link>
            <Link href="/terms"><a className="hover:text-foreground">Terms of Service</a></Link>
            <Link href="/cookies"><a className="hover:text-foreground">Cookie Policy</a></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
