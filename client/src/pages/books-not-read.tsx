import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  ChevronRight,
  MapPin,
  Menu,
  Shield,
  Sparkles,
  Upload,
  Users,
  X,
  LogIn,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api, type UserProfile } from "@/lib/api";

import heroExchange from "@/assets/images/hero-exchange.jpg";

function clampPostcode(value: string) {
  return value.replace(/\s+/g, "").toUpperCase().slice(0, 8);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

export default function BooksNotReadPage() {
  const queryClient = useQueryClient();
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("authToken"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPostcode, setAuthPostcode] = useState("");

  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookImage, setBookImage] = useState("");
  const [bookDesc, setBookDesc] = useState("");
  const [bookCondition, setBookCondition] = useState<"like-new" | "good" | "fair" | "poor">("good");
  const [bookType, setBookType] = useState<"adult" | "children">("adult");

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => api.auth.me(),
    enabled: isLoggedIn,
    retry: false,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["badges", user?.id],
    queryFn: () => api.users.getBadges(user!.id),
    enabled: !!user?.id,
  });

  const { data: allBooks = [] } = useQuery({
    queryKey: ["books", user?.postcode],
    queryFn: () => api.books.list(user?.postcode),
    enabled: !!user?.postcode,
  });

  const { data: activeAreas = [] } = useQuery({
    queryKey: ["activeAreas"],
    queryFn: () => api.activeAreas.get(),
  });

  const localBooks = useMemo(() => {
    if (!user) return [];
    return allBooks.filter((b) => b.postcode === user.postcode && b.ownerId !== user.id);
  }, [allBooks, user]);

  const myUploads = useMemo(() => {
    if (!user) return [];
    return allBooks.filter((b) => b.ownerId === user.id);
  }, [allBooks, user]);

  const isSubscribed = user?.subscriptionStatus === "active";

  const registerMutation = useMutation({
    mutationFn: api.auth.register,
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("token", data.token);
      setIsLoggedIn(true);
      refetchUser();
      resetAuthForm();
      setShowAuthModal(false);
      toast.success(`Welcome, ${data.user.name}!`);
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => toast.error(error.message || "Registration failed"),
  });

  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("token", data.token);
      setIsLoggedIn(true);
      refetchUser();
      resetAuthForm();
      setShowAuthModal(false);
      toast.success(`Welcome back, ${data.user.name}!`);
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => toast.error(error.message || "Login failed"),
  });

  const createBookMutation = useMutation({
    mutationFn: api.books.create,
    onSuccess: (newBook) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      setBookTitle("");
      setBookAuthor("");
      setBookImage("");
      setBookDesc("");
      setBookCondition("good");
      setBookType("adult");
      toast.success(`"${newBook.title}" uploaded!`);
    },
    onError: (error: Error) => toast.error(error.message || "Upload failed"),
  });

  const requestSwapMutation = useMutation({
    mutationFn: api.swaps.request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      toast.success("Swap requested! The owner will be notified.");
    },
    onError: (error: Error) => toast.error(error.message || "Swap request failed"),
  });

  const subscribeMutation = useMutation({
    mutationFn: api.stripe.createCheckoutSession,
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => toast.error(error.message || "Failed to start subscription"),
  });

  const resetAuthForm = () => {
    setAuthEmail("");
    setAuthPassword("");
    setAuthName("");
    setAuthPostcode("");
  };

  const handleAuth = () => {
    if (authMode === "register") {
      const name = authName.trim();
      const postcode = clampPostcode(authPostcode.trim());
      const email = authEmail.trim().toLowerCase();
      const password = authPassword;

      if (!email || !password || !name || !postcode) {
        toast.error("Please fill in all fields");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      registerMutation.mutate({ email, password, name, postcode });
    } else {
      const email = authEmail.trim().toLowerCase();
      const password = authPassword;
      if (!email || !password) {
        toast.error("Enter email and password");
        return;
      }
      loginMutation.mutate({ email, password });
    }
  };

  const subscribe = () => {
    subscribeMutation.mutate();
  };

  const uploadBook = () => {
    if (!isSubscribed) {
      toast.error("Subscribe to upload books");
      return;
    }
    const title = bookTitle.trim();
    const author = bookAuthor.trim();
    if (!title || !author) {
      toast.error("Enter title and author");
      return;
    }
    createBookMutation.mutate({
      title,
      author,
      image: bookImage.trim() || undefined,
      description: bookDesc.trim() || undefined,
      condition: bookCondition,
      type: bookType,
    });
  };

  const requestSwap = (bookId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    requestSwapMutation.mutate(bookId);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
    queryClient.clear();
    toast("Signed out");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container-narrow section-padding">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="size-6 text-primary" />
              <span className="font-display text-lg font-semibold">BooksSwap</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden items-center gap-8 md:flex">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
              <a href="#safety" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Safety</a>
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm">{user.name}</span>
                  <Button variant="outline" size="sm" onClick={logout} className="touch-target">
                    Sign out
                  </Button>
                </div>
              ) : (
                <button 
                  onClick={() => { setAuthMode("register"); setShowAuthModal(true); }}
                  className="px-8 py-3 text-white font-semibold rounded-full transition-all hover:-translate-y-0.5"
                  style={{ 
                    backgroundColor: '#2C5F4A',
                    boxShadow: '0 4px 12px rgba(44, 95, 74, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#234a3a';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(44, 95, 74, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2C5F4A';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(44, 95, 74, 0.4)';
                  }}
                  data-testid="button-join-now-header"
                >
                  Join now
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="touch-target flex items-center justify-center md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t bg-background md:hidden">
            <div className="section-padding space-y-4 py-6">
              <a href="#features" className="block py-2 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#how-it-works" className="block py-2 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>How it works</a>
              <a href="#safety" className="block py-2 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Safety</a>
              {user ? (
                <Button variant="outline" className="w-full touch-target" onClick={logout}>Sign out</Button>
              ) : (
                <button 
                  onClick={() => { setAuthMode("register"); setShowAuthModal(true); setMobileMenuOpen(false); }}
                  className="w-full px-8 py-3 text-white font-semibold rounded-full transition-all"
                  style={{ 
                    backgroundColor: '#2C5F4A',
                    boxShadow: '0 4px 12px rgba(44, 95, 74, 0.4)'
                  }}
                  data-testid="button-join-now-mobile"
                >
                  Join now
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">
                {authMode === "register" ? "Join BooksSwap" : "Welcome back"}
              </h2>
              <button onClick={() => setShowAuthModal(false)} className="touch-target flex items-center justify-center">
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>
            <p className="mb-6 text-muted-foreground">
              {authMode === "register" 
                ? "Create your account to start swapping books with neighbours."
                : "Sign in to your account."
              }
            </p>
            <div className="space-y-4">
              {authMode === "register" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Your name</label>
                    <Input
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Jane Smith"
                      className="h-12"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Postcode</label>
                    <Input
                      value={authPostcode}
                      onChange={(e) => setAuthPostcode(e.target.value)}
                      placeholder="SW1A 1AA"
                      className="h-12"
                      data-testid="input-postcode"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="h-12"
                  data-testid="input-email"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder={authMode === "register" ? "Min 8 characters" : "••••••••"}
                  className="h-12"
                  data-testid="input-password"
                />
              </div>
              <Button 
                className="h-12 w-full text-base" 
                onClick={handleAuth} 
                disabled={registerMutation.isPending || loginMutation.isPending}
                data-testid="button-auth"
              >
                {registerMutation.isPending || loginMutation.isPending 
                  ? "Please wait..." 
                  : authMode === "register" ? "Create account" : "Sign in"
                }
              </Button>
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {authMode === "register" ? (
                <>Already have an account? <button className="text-primary hover:underline" onClick={() => setAuthMode("login")}>Sign in</button></>
              ) : (
                <>Don't have an account? <button className="text-primary hover:underline" onClick={() => setAuthMode("register")}>Join now</button></>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroExchange} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>
        <div className="container-narrow section-padding relative">
          <div className="py-20 md:py-32 lg:py-40">
            <div className="max-w-xl">
              <h1 className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl">
                Give Your Finished Books a Second Life
              </h1>
              <p className="mt-6 text-lg text-white/80 md:text-xl">
                Swap books with neighbours in your postcode. Simple and community-driven.
              </p>
              <div className="mt-8">
                <Button variant="outline" size="lg" className="h-14 border-white/30 bg-white/10 px-8 text-base text-white hover:bg-white/20 touch-target" asChild>
                  <a href="#how-it-works">Learn more</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
        <div className="container-narrow section-padding">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="font-display text-3xl font-semibold md:text-4xl">Why BooksSwap?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              A simple, safe way to share books with people in your neighbourhood.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card-elevated p-8">
              <div className="icon-container bg-primary/10 text-primary">
                <MapPin className="size-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold">Hyper-local</h3>
              <p className="mt-3 text-muted-foreground">
                Only see books from people in your postcode. No shipping, no hassle — just walk and swap.
              </p>
            </div>
            <div className="card-elevated p-8">
              <div className="icon-container bg-accent/10 text-accent">
                <Shield className="size-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold">Safety first</h3>
              <p className="mt-3 text-muted-foreground">
                Meet in public places during daylight. Built-in guidelines help you swap with confidence.
              </p>
            </div>
            <div className="card-elevated p-8">
              <div className="icon-container bg-primary/10 text-primary">
                <Award className="size-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold">Earn badges</h3>
              <p className="mt-3 text-muted-foreground">
                Upload books and complete swaps to earn badges and climb your local leaderboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-muted/50 py-16 md:py-24">
        <div className="container-narrow section-padding">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="font-display text-3xl font-semibold md:text-4xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Three simple steps to start swapping books.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">1</div>
              <h3 className="mt-6 font-display text-xl font-semibold">Sign up</h3>
              <p className="mt-3 text-muted-foreground">Start your free 7-day trial with your postcode.</p>
            </div>
            <div className="relative">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">2</div>
              <h3 className="mt-6 font-display text-xl font-semibold">Try it free</h3>
              <p className="mt-3 text-muted-foreground">Upload and swap books for a week at no cost.</p>
            </div>
            <div className="relative">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">3</div>
              <h3 className="mt-6 font-display text-xl font-semibold">Continue for £0.50/month</h3>
              <p className="mt-3 text-muted-foreground">Keep swapping after trial - cancel anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      {user && (
        <section id="dashboard" className="py-16 md:py-24">
          <div className="container-narrow section-padding">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="font-display text-3xl font-semibold">Your Dashboard</h2>
                <p className="mt-2 text-muted-foreground">Welcome, {user.name}! ({user.postcode})</p>
              </div>
              <div className="flex items-center gap-2">
                {isSubscribed ? (
                  <Badge variant="default" className="bg-green-600">Subscribed</Badge>
                ) : (
                  <Button onClick={subscribe} disabled={subscribeMutation.isPending} className="touch-target">
                    <CreditCard className="mr-2 size-4" />
                    {subscribeMutation.isPending ? "Loading..." : "Subscribe £0.50/mo"}
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Upload form */}
                {isSubscribed && (
                  <div className="card-elevated p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="icon-container-sm bg-primary/10 text-primary">
                        <Upload className="size-5" />
                      </div>
                      <h3 className="font-display font-semibold">Upload a book</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        value={bookTitle}
                        onChange={(e) => setBookTitle(e.target.value)}
                        placeholder="Book title"
                        data-testid="input-book-title"
                      />
                      <Input
                        value={bookAuthor}
                        onChange={(e) => setBookAuthor(e.target.value)}
                        placeholder="Author"
                        data-testid="input-book-author"
                      />
                      <Input
                        value={bookImage}
                        onChange={(e) => setBookImage(e.target.value)}
                        placeholder="Cover image URL (optional)"
                        data-testid="input-book-image"
                      />
                      <select
                        value={bookCondition}
                        onChange={(e) => setBookCondition(e.target.value as any)}
                        className="h-10 rounded-md border px-3"
                        data-testid="select-book-condition"
                      >
                        <option value="like-new">Like New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                      <select
                        value={bookType}
                        onChange={(e) => setBookType(e.target.value as any)}
                        className="h-10 rounded-md border px-3"
                        data-testid="select-book-type"
                      >
                        <option value="adult">Adult</option>
                        <option value="children">Children's</option>
                      </select>
                      <Textarea
                        value={bookDesc}
                        onChange={(e) => setBookDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="sm:col-span-2"
                        data-testid="input-book-desc"
                      />
                    </div>
                    <Button
                      className="mt-4 touch-target"
                      onClick={uploadBook}
                      disabled={createBookMutation.isPending}
                      data-testid="button-upload-book"
                    >
                      {createBookMutation.isPending ? "Uploading..." : "Upload book"}
                    </Button>
                  </div>
                )}

                {!isSubscribed && (
                  <div className="card-elevated p-6 text-center">
                    <CreditCard className="mx-auto size-12 text-muted-foreground/40" />
                    <h3 className="mt-4 font-display font-semibold">Subscribe to upload books</h3>
                    <p className="mt-2 text-muted-foreground">Just £0.50/month for unlimited uploads and swaps.</p>
                    <Button onClick={subscribe} disabled={subscribeMutation.isPending} className="mt-4 touch-target">
                      {subscribeMutation.isPending ? "Loading..." : "Subscribe now"}
                    </Button>
                  </div>
                )}

                {/* My uploads */}
                <div className="card-elevated p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="icon-container-sm bg-accent/10 text-accent">
                      <BookOpen className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">My uploads</h3>
                      <p className="text-xs text-muted-foreground">{myUploads.length} books</p>
                    </div>
                  </div>
                  {myUploads.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No books uploaded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {myUploads.map((book) => (
                        <div key={book.id} className="flex items-center gap-3 rounded-lg border px-3 py-2" data-testid={`my-book-${book.id}`}>
                          {book.image ? (
                            <img src={book.image} alt="" className="size-10 rounded object-cover" />
                          ) : (
                            <div className="flex size-10 items-center justify-center rounded bg-muted">
                              <BookOpen className="size-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{book.title}</div>
                            <div className="text-xs text-muted-foreground">{book.author}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">{book.condition}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available books */}
                <div className="card-elevated p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="icon-container-sm bg-primary/10 text-primary">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">Books in {user.postcode}</h3>
                      <p className="text-xs text-muted-foreground">{localBooks.length} available</p>
                    </div>
                  </div>
                  {localBooks.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed p-12 text-center">
                      <BookOpen className="mx-auto size-12 text-muted-foreground/40" />
                      <p className="mt-4 text-muted-foreground">
                        No books in your area yet. Be the first to upload!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {localBooks.map((book) => (
                        <div key={book.id} className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row" data-testid={`book-${book.id}`}>
                          {book.image ? (
                            <img src={book.image} alt="" className="h-32 w-24 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-32 w-24 items-center justify-center rounded-lg bg-muted">
                              <BookOpen className="size-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex flex-1 flex-col">
                            <div className="text-lg font-medium">{book.title}</div>
                            <div className="text-muted-foreground">{book.author}</div>
                            <div className="mt-1 flex gap-2">
                              <Badge variant="outline" className="text-xs">{book.condition}</Badge>
                              <Badge variant="outline" className="text-xs">{book.type}</Badge>
                            </div>
                            {book.description && (
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{book.description}</p>
                            )}
                            <div className="mt-auto flex items-center justify-between pt-4">
                              <span className="text-sm text-muted-foreground">From {book.ownerName}</span>
                              <Button onClick={() => requestSwap(book.id)} disabled={requestSwapMutation.isPending} className="touch-target" data-testid={`button-swap-${book.id}`}>
                                Request swap
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Badges */}
                <div className="card-elevated p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="icon-container-sm bg-accent/10 text-accent">
                      <Award className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">Your badges</h3>
                      <p className="text-xs text-muted-foreground">{userBadges.length} earned</p>
                    </div>
                  </div>
                  {userBadges.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Upload a book or complete 3 swaps to earn badges!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {userBadges.map((badge) => (
                        <div key={badge.id} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2" data-testid={`badge-${badge.id}`}>
                          <Award className="size-4 text-accent" />
                          <span className="text-sm font-medium">{badge.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Areas */}
                <div className="card-elevated p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="icon-container-sm bg-primary/10 text-primary">
                      <MapPin className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">Active Areas</h3>
                      <p className="text-xs text-muted-foreground">Where swapping is happening</p>
                    </div>
                  </div>
                  {activeAreas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active areas yet. Be first!</p>
                  ) : (
                    <div className="space-y-2">
                      {activeAreas.slice(0, 5).map((area, i) => (
                        <div key={area.postcode} className="flex items-center gap-3 rounded-lg border px-3 py-2" data-testid={`area-${area.postcode}`}>
                          <div className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${
                            i === 0 ? "bg-green-100 text-green-700" :
                            i === 1 ? "bg-green-50 text-green-600" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {i + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{area.postcode}</div>
                            <div className="text-xs text-muted-foreground">
                              {area.bookCount} books · {area.userCount} members
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Safety Section */}
      <section id="safety" className="bg-amber-50 py-16 dark:bg-amber-950/20 md:py-24">
        <div className="container-narrow section-padding">
          <div className="mx-auto max-w-3xl text-center">
            <Shield className="mx-auto size-12 text-amber-600" />
            <h2 className="mt-6 font-display text-3xl font-semibold md:text-4xl">Safety Guidelines</h2>
            <p className="mt-4 text-muted-foreground">
              Your safety is our priority. Follow these guidelines when meeting to swap books.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-card">
              <h3 className="font-display font-semibold">Meet in public places</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Libraries and cafés are ideal locations.
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-card">
              <h3 className="font-display font-semibold">During daylight hours</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Schedule swaps when it's light outside for visibility.
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-card">
              <h3 className="font-display font-semibold">Tell someone</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Let a friend or family member know where you're going.
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-card">
              <h3 className="font-display font-semibold">Trust your instincts</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                If something feels off, it's okay to cancel the swap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container-narrow section-padding">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center justify-between gap-6 w-full md:flex-row">
              <div className="flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                <span className="font-display font-semibold">BooksSwap</span>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <a href="/faq" className="hover:text-foreground transition-colors">FAQ</a>
                <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
                <a href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</a>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} BooksSwap. All rights reserved.
              </p>
            </div>
            {!user && (
              <p className="text-sm text-muted-foreground">
                Already a member?{" "}
                <button 
                  onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
                  className="font-medium hover:underline transition-colors"
                  style={{ color: '#C17A5B' }}
                  data-testid="link-sign-in-footer"
                >
                  Sign in
                </button>
              </p>
            )}
            <div className="flex items-center gap-4 mt-4">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Instagram (coming soon)"
                data-testid="link-instagram"
              >
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="X / Twitter (coming soon)"
                data-testid="link-twitter"
              >
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Facebook (coming soon)"
                data-testid="link-facebook"
              >
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
