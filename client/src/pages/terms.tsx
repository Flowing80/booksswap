import { BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function TermsPage() {
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
        <h1 className="font-display text-3xl font-semibold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-6">Last updated: January 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using BooksSwap, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              BooksSwap is a platform that connects book owners in the same postcode area to 
              facilitate book exchanges. We provide the platform but are not a party to any 
              swap arrangement between users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">3. Subscription and Payments</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>BooksSwap offers a subscription service at £0.50 per month.</li>
              <li>Subscription is required to upload books and request swaps.</li>
              <li>You may cancel your subscription at any time through your account settings.</li>
              <li>Payments are processed securely through Stripe.</li>
              <li>Refunds are provided in accordance with applicable consumer protection laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">4. User Responsibilities</h2>
            <p className="text-muted-foreground mb-4">As a user, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate information about yourself and your books</li>
              <li>Only upload books you own and are willing to swap</li>
              <li>Accurately describe the condition of your books</li>
              <li>Communicate respectfully with other users</li>
              <li>Meet in public places for swaps as recommended in our safety guidelines</li>
              <li>Not use the platform for any illegal purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Children's Books</h2>
            <p className="text-muted-foreground">
              Adults may list and swap children's books on behalf of minors. The adult account 
              holder is responsible for all activity related to children's books and must 
              accompany any minor during in-person swaps.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Safety</h2>
            <p className="text-muted-foreground">
              BooksSwap facilitates connections but does not verify users' identities. Users 
              meet at their own risk. We strongly recommend following our safety guidelines: 
              meet in public places, during daylight hours, and inform someone of your plans.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Prohibited Content</h2>
            <p className="text-muted-foreground mb-4">You may not upload or share:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Counterfeit or pirated books</li>
              <li>Offensive, illegal, or inappropriate content</li>
              <li>False or misleading information</li>
              <li>Spam or promotional material unrelated to book swapping</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              BooksSwap is provided "as is" without warranties. We are not liable for any disputes 
              between users, the condition of swapped books, or any incidents that occur during 
              in-person meetups. Our liability is limited to the amount of subscription fees you 
              have paid.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">9. Account Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate accounts that violate these terms or 
              engage in behaviour harmful to other users or the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">10. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these terms from time to time. Continued use of the service after 
              changes constitutes acceptance of the new terms.
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
