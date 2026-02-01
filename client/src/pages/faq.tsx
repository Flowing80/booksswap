import { BookOpen, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left hover:text-primary transition-colors"
        data-testid={`faq-${question.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
      >
        <span className="font-medium pr-4">{question}</span>
        <ChevronDown className={`size-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="pb-4 text-muted-foreground">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const faqs = [
    {
      question: "How do book swaps work?",
      answer: "It's simple! Browse books in your postcode area, request a swap with the owner, and once they accept, arrange to meet in a public place to exchange books. Both parties mark the swap as complete when done."
    },
    {
      question: "How much does BooksSwap cost?",
      answer: "BooksSwap starts with a free 7-day trial. After that, it's just £0.50 per month. You can cancel anytime during or after your trial with no charge."
    },
    {
      question: "Is it safe to meet strangers?",
      answer: "We recommend always meeting in public places like libraries or cafés, during daylight hours, and letting someone know where you're going. Never invite strangers to your home or go to theirs."
    },
    {
      question: "What if someone doesn't show up?",
      answer: "If someone doesn't show up for a swap, you can reject the swap request and make your book available again. Repeated no-shows may result in account suspension."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel anytime from your dashboard — no charge, no questions asked. If you cancel during your free trial, you won't be charged at all. If you cancel after, your subscription stays active until the end of your current billing period."
    },
    {
      question: "What books can I upload?",
      answer: "You can upload any books you own and are willing to swap - both adult and children's books. Please accurately describe the condition (Like New, Good, Fair, or Poor) so others know what to expect."
    },
    {
      question: "Can I swap children's books?",
      answer: "Yes! Adults can list and swap children's books. The adult account holder is responsible for the swap and should accompany any children during meetups."
    },
    {
      question: "How do badges work?",
      answer: "You earn badges by being active on the platform. Upload your first book to get 'Book Uploader', complete swaps to earn 'First Swap', '5 Swaps', and '10 Swaps' badges. More badges will be added!"
    },
    {
      question: "Why can I only see books in my postcode?",
      answer: "BooksSwap is designed for local, in-person swaps - no shipping needed! We match you with book lovers in your area so you can simply walk and swap."
    },
    {
      question: "How is my postcode used?",
      answer: "Your postcode is used to match you with other users in your area. Only your postcode area (not your full address) is visible to other users."
    },
    {
      question: "What if I receive a book in worse condition than described?",
      answer: "We encourage honest descriptions. If you receive a book in significantly worse condition than described, please contact support. Repeated misrepresentation may result in account action."
    },
    {
      question: "Can I delete my account?",
      answer: "Yes, you can request account deletion by contacting us. This will remove your profile, books, and swap history from the platform."
    }
  ];

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
        <h1 className="font-display text-3xl font-semibold mb-4">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mb-8">
          Find answers to common questions about BooksSwap.
        </p>

        <div className="max-w-3xl">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        <div className="mt-12 p-6 bg-muted/50 rounded-xl">
          <h2 className="font-display font-semibold mb-2">Still have questions?</h2>
          <p className="text-muted-foreground">
            If you can't find the answer you're looking for, please contact us through the platform 
            and we'll be happy to help.
          </p>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container-narrow section-padding">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link href="/"><a className="hover:text-foreground">Home</a></Link>
            <Link href="/faq"><a className="hover:text-foreground">FAQ</a></Link>
            <Link href="/privacy"><a className="hover:text-foreground">Privacy Policy</a></Link>
            <Link href="/terms"><a className="hover:text-foreground">Terms of Service</a></Link>
            <Link href="/cookies"><a className="hover:text-foreground">Cookie Policy</a></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
