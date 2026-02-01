import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Book, ArrowLeftRight, Award, Trash2, Check, X, LogOut, MapPin, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  name: string;
  postcode: string;
  subscriptionStatus: string;
  swaps: number;
}

interface Book {
  id: string;
  title: string;
  author: string;
  condition: string;
  type: string;
  status: string;
  postcode: string;
  ownerName: string;
  ownerId: string;
}

interface Badge {
  id: string;
  name: string;
  createdAt: string;
}

interface SwapRequest {
  id: string;
  bookId: string;
  requesterId: string;
  ownerId: string;
  status: string;
  createdAt: string;
}

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"books" | "swaps" | "profile">("books");
  const [showAddBook, setShowAddBook] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
  });

  const { data: myBooks = [], isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
    queryFn: async () => {
      const res = await fetch("/api/my-books", { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Failed to fetch books");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: swaps = [], isLoading: swapsLoading } = useQuery<SwapRequest[]>({
    queryKey: ["/api/swaps/incoming"],
    queryFn: async () => {
      const res = await fetch("/api/swaps/incoming", { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Failed to fetch swaps");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ["/api/users", user?.id, "badges"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user?.id}/badges`);
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: allBooks = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"],
    queryFn: async () => {
      const res = await fetch("/api/books");
      if (!res.ok) throw new Error("Failed to fetch books");
      return res.json();
    },
    enabled: !!user,
  });

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/";
    return null;
  }

  const isSubscribed = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing";

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container-narrow section-padding">
          <div className="flex h-16 items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2">
                <BookOpen className="size-6 text-primary" />
                <span className="font-display text-lg font-semibold">BooksSwap</span>
              </a>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="size-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container-narrow section-padding py-8">
        {!isSubscribed && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-800">
              <strong>Start your free trial</strong> to upload books and request swaps.{" "}
              <a href="/" className="underline">Subscribe for just £0.50/month</a>
            </p>
          </div>
        )}

        <div className="flex gap-2 mb-8 border-b">
          <button
            onClick={() => setActiveTab("books")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "books" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-books"
          >
            <Book className="size-4 inline mr-2" />
            My Books
          </button>
          <button
            onClick={() => setActiveTab("swaps")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "swaps" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-swaps"
          >
            <ArrowLeftRight className="size-4 inline mr-2" />
            Swaps
            {swaps.filter(s => s.status === "pending" && s.ownerId === user.id).length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {swaps.filter(s => s.status === "pending" && s.ownerId === user.id).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "profile" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-profile"
          >
            <Award className="size-4 inline mr-2" />
            Profile
          </button>
        </div>

        {activeTab === "books" && (
          <BooksTab
            books={myBooks}
            loading={booksLoading}
            isSubscribed={isSubscribed}
            showAddBook={showAddBook}
            setShowAddBook={setShowAddBook}
            user={user}
          />
        )}

        {activeTab === "swaps" && (
          <SwapsTab
            swaps={swaps}
            allBooks={allBooks}
            loading={swapsLoading}
            userId={user.id}
          />
        )}

        {activeTab === "profile" && (
          <ProfileTab user={user} badges={badges} />
        )}
      </main>
    </div>
  );
}

function BooksTab({ books, loading, isSubscribed, showAddBook, setShowAddBook, user }: {
  books: Book[];
  loading: boolean;
  isSubscribed: boolean;
  showAddBook: boolean;
  setShowAddBook: (show: boolean) => void;
  user: User;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [condition, setCondition] = useState("good");
  const [type, setType] = useState("adult");

  const addBookMutation = useMutation({
    mutationFn: async (data: { title: string; author: string; condition: string; type: string }) => {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add book");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      setShowAddBook(false);
      setTitle("");
      setAuthor("");
      setCondition("good");
      setType("adult");
      toast({ title: "Book added!", description: "Your book is now available for swapping." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to delete book");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      toast({ title: "Book removed" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    addBookMutation.mutate({ title, author, condition, type });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold">My Books</h2>
        {isSubscribed && (
          <Button onClick={() => setShowAddBook(true)} data-testid="button-add-book">
            <Plus className="size-4 mr-2" />
            Add Book
          </Button>
        )}
      </div>

      {showAddBook && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-muted/50 rounded-xl space-y-4">
          <h3 className="font-semibold text-lg">Add a new book</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Book title"
                required
                data-testid="input-book-title"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Author</label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
                required
                data-testid="input-book-author"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background"
                data-testid="select-book-condition"
              >
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background"
                data-testid="select-book-type"
              >
                <option value="adult">Adult</option>
                <option value="children">Children's</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={addBookMutation.isPending} data-testid="button-submit-book">
              {addBookMutation.isPending ? "Adding..." : "Add Book"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowAddBook(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Book className="size-12 mx-auto mb-4 opacity-50" />
          <p>You haven't added any books yet.</p>
          {isSubscribed && (
            <Button className="mt-4" onClick={() => setShowAddBook(true)}>
              Add your first book
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <div key={book.id} className="p-4 border rounded-xl bg-card" data-testid={`book-card-${book.id}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold line-clamp-1">{book.title}</h3>
                <button
                  onClick={() => deleteBookMutation.mutate(book.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove book"
                  data-testid={`button-delete-book-${book.id}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
              <div className="flex gap-2 text-xs">
                <span className={`px-2 py-1 rounded-full ${
                  book.status === "available" ? "bg-green-100 text-green-700" :
                  book.status === "pending" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {book.status}
                </span>
                <span className="px-2 py-1 rounded-full bg-muted">{book.condition}</span>
                <span className="px-2 py-1 rounded-full bg-muted">{book.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SwapsTab({ swaps, allBooks, loading, userId }: {
  swaps: SwapRequest[];
  allBooks: Book[];
  loading: boolean;
  userId: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getBook = (bookId: string) => allBooks.find(b => b.id === bookId);

  const acceptMutation = useMutation({
    mutationFn: async (swapId: string) => {
      const res = await fetch(`/api/swaps/${swapId}/accept`, {
        method: "POST",
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to accept swap");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swaps/incoming"] });
      toast({ title: "Swap accepted!", description: "Arrange to meet and complete the swap." });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (swapId: string) => {
      const res = await fetch(`/api/swaps/${swapId}/reject`, {
        method: "POST",
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to reject swap");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swaps/incoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      toast({ title: "Swap rejected", description: "The book is available again." });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (swapId: string) => {
      const res = await fetch(`/api/swaps/${swapId}/complete`, {
        method: "POST",
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to complete swap");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swaps/incoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Swap completed!", description: "Great job swapping books!" });
    },
  });

  const incomingPending = swaps.filter(s => s.ownerId === userId && s.status === "pending");
  const incomingAccepted = swaps.filter(s => s.ownerId === userId && s.status === "accepted");
  const outgoingPending = swaps.filter(s => s.requesterId === userId && s.status === "pending");
  const outgoingAccepted = swaps.filter(s => s.requesterId === userId && s.status === "accepted");
  const completed = swaps.filter(s => s.status === "completed");

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {incomingPending.length > 0 && (
        <section>
          <h3 className="font-semibold text-lg mb-4">Pending Requests (for your books)</h3>
          <div className="space-y-3">
            {incomingPending.map((swap) => {
              const book = getBook(swap.bookId);
              return (
                <div key={swap.id} className="p-4 border rounded-xl flex items-center justify-between" data-testid={`swap-pending-${swap.id}`}>
                  <div>
                    <p className="font-medium">{book?.title || "Unknown book"}</p>
                    <p className="text-sm text-muted-foreground">Someone wants to swap for this book</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptMutation.mutate(swap.id)}
                      disabled={acceptMutation.isPending}
                      data-testid={`button-accept-${swap.id}`}
                    >
                      <Check className="size-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMutation.mutate(swap.id)}
                      disabled={rejectMutation.isPending}
                      data-testid={`button-reject-${swap.id}`}
                    >
                      <X className="size-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {(incomingAccepted.length > 0 || outgoingAccepted.length > 0) && (
        <section>
          <h3 className="font-semibold text-lg mb-4">Accepted - Ready to meet!</h3>
          <div className="space-y-3">
            {[...incomingAccepted, ...outgoingAccepted].map((swap) => {
              const book = getBook(swap.bookId);
              const isOwner = swap.ownerId === userId;
              return (
                <div key={swap.id} className="p-4 border rounded-xl border-green-200 bg-green-50" data-testid={`swap-accepted-${swap.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{book?.title || "Unknown book"}</p>
                      <p className="text-sm text-muted-foreground">
                        {isOwner ? "You're giving this book" : "You're receiving this book"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => completeMutation.mutate(swap.id)}
                      disabled={completeMutation.isPending}
                      data-testid={`button-complete-${swap.id}`}
                    >
                      <Check className="size-4 mr-1" />
                      Mark Complete
                    </Button>
                  </div>
                  <div className="mt-3 p-3 bg-white rounded-lg text-sm">
                    <p className="font-medium text-amber-700 mb-1">Safety reminders:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>Meet in a public place (library or café)</li>
                      <li>During daylight hours</li>
                      <li>Let someone know where you're going</li>
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {outgoingPending.length > 0 && (
        <section>
          <h3 className="font-semibold text-lg mb-4">Your Requests (waiting for response)</h3>
          <div className="space-y-3">
            {outgoingPending.map((swap) => {
              const book = getBook(swap.bookId);
              return (
                <div key={swap.id} className="p-4 border rounded-xl" data-testid={`swap-outgoing-${swap.id}`}>
                  <p className="font-medium">{book?.title || "Unknown book"}</p>
                  <p className="text-sm text-muted-foreground">Waiting for the owner to respond...</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h3 className="font-semibold text-lg mb-4">Completed Swaps</h3>
          <div className="space-y-3">
            {completed.slice(0, 5).map((swap) => {
              const book = getBook(swap.bookId);
              return (
                <div key={swap.id} className="p-4 border rounded-xl opacity-75" data-testid={`swap-completed-${swap.id}`}>
                  <p className="font-medium">{book?.title || "Unknown book"}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {swaps.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ArrowLeftRight className="size-12 mx-auto mb-4 opacity-50" />
          <p>No swap activity yet.</p>
          <p className="text-sm mt-2">Browse books in your area and request a swap!</p>
        </div>
      )}
    </div>
  );
}

function ProfileTab({ user, badges }: { user: User; badges: Badge[] }) {
  const badgeIcons: Record<string, string> = {
    "First Swap": "🎉",
    "5 Swaps": "⭐",
    "10 Swaps": "🏆",
    "Book Uploader": "📚",
    "5 Books": "📖",
    "10 Books": "🎯",
  };

  return (
    <div className="max-w-2xl">
      <div className="p-6 border rounded-xl mb-8">
        <h2 className="font-display text-2xl font-semibold mb-4">{user.name}</h2>
        <div className="space-y-2 text-muted-foreground">
          <p className="flex items-center gap-2">
            <MapPin className="size-4" />
            {user.postcode}
          </p>
          <p>
            <span className="font-semibold text-foreground">{user.swaps}</span> completed swaps
          </p>
          <p>
            Subscription:{" "}
            <span className={user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing" ? "text-green-600 font-medium" : "text-amber-600"}>
              {user.subscriptionStatus === "active" ? "Active" : user.subscriptionStatus === "trialing" ? "Free Trial" : "Inactive"}
            </span>
          </p>
        </div>
      </div>

      <h3 className="font-semibold text-lg mb-4">My Badges</h3>
      {badges.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-xl">
          <Award className="size-12 mx-auto mb-4 opacity-50" />
          <p>No badges earned yet.</p>
          <p className="text-sm mt-2">Upload books and complete swaps to earn badges!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {badges.map((badge) => (
            <div key={badge.id} className="p-4 border rounded-xl flex items-center gap-3" data-testid={`badge-${badge.name}`}>
              <span className="text-3xl">{badgeIcons[badge.name] || "🏅"}</span>
              <div>
                <p className="font-medium">{badge.name}</p>
                <p className="text-xs text-muted-foreground">
                  Earned {new Date(badge.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-muted/50 rounded-xl">
        <h4 className="font-medium mb-2">Available Badges</h4>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <p>📚 <strong>Book Uploader</strong> - Upload your first book</p>
          <p>📖 <strong>5 Books</strong> - Upload 5 books</p>
          <p>🎯 <strong>10 Books</strong> - Upload 10 books</p>
          <p>🎉 <strong>First Swap</strong> - Complete your first swap</p>
          <p>⭐ <strong>5 Swaps</strong> - Complete 5 swaps</p>
          <p>🏆 <strong>10 Swaps</strong> - Complete 10 swaps</p>
        </div>
      </div>
    </div>
  );
}
