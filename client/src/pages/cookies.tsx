import { BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function CookiesPage() {
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
        <h1 className="font-display text-3xl font-semibold mb-8">Cookie Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: January 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">1. What Are Cookies?</h2>
            <p className="text-muted-foreground">
              Cookies are small text files stored on your device when you visit a website. 
              They help the website remember your preferences and improve your experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Cookies</h2>
            <p className="text-muted-foreground mb-4">BooksSwap uses minimal cookies for essential functions:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Authentication:</strong> We store your login token in your browser's local storage to keep you signed in.</li>
              <li><strong>Preferences:</strong> We may remember your display preferences.</li>
              <li><strong>Security:</strong> We use cookies to protect against security threats.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">3. Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Essential Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  Required for the website to function. These cannot be disabled.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Purpose:</strong> Authentication, security, basic functionality
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Functional Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  Remember your preferences and settings.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Purpose:</strong> Personalisation, remembering your choices
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Third-Party Cookies</h2>
            <p className="text-muted-foreground mb-4">
              We use the following third-party services that may set their own cookies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Stripe:</strong> For secure payment processing. See Stripe's cookie policy for details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Managing Cookies</h2>
            <p className="text-muted-foreground mb-4">
              You can control cookies through your browser settings:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Most browsers allow you to block or delete cookies</li>
              <li>Blocking essential cookies may prevent the website from working correctly</li>
              <li>You can clear your browser's local storage to remove your login token</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Local Storage</h2>
            <p className="text-muted-foreground">
              In addition to cookies, we use your browser's local storage to store your 
              authentication token. This keeps you logged in between visits. You can clear 
              this by logging out or clearing your browser data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about our use of cookies, please contact us through 
              the platform.
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
