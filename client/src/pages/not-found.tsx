import { BookOpen, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b bg-background/95 backdrop-blur">
        <div className="container-narrow section-padding">
          <div className="flex h-16 items-center">
            <a href="/" className="flex items-center gap-2">
              <BookOpen className="size-6 text-primary" />
              <span className="font-display text-lg font-semibold">BooksSwap</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-8xl font-bold text-muted-foreground/20 mb-4">404</div>
          <h1 className="font-display text-3xl font-semibold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. It may have been moved or doesn't exist.
          </p>
          <Button asChild size="lg" className="touch-target">
            <a href="/">
              <Home className="mr-2 size-4" />
              Back to Home
            </a>
          </Button>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container-narrow section-padding">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="/" className="hover:text-foreground">Home</a>
            <a href="/privacy" className="hover:text-foreground">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground">Terms of Service</a>
            <a href="/cookies" className="hover:text-foreground">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
