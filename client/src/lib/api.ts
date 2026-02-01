import type { User, Book, Badge, RegisterUser, LoginUser, SwapRequest } from "@shared/schema";

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    postcode: string;
    subscriptionStatus: string;
  };
  token: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  name: string;
  postcode: string;
  subscriptionStatus: string;
  swaps: number;
}

export const api = {
  auth: {
    register: (data: RegisterUser) =>
      fetchJSON<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (data: LoginUser) =>
      fetchJSON<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    me: () => fetchJSON<UserProfile>("/api/auth/me"),
  },
  users: {
    get: (id: string) => fetchJSON<UserProfile>(`/api/users/${id}`),
    getBadges: (id: string) => fetchJSON<Badge[]>(`/api/users/${id}/badges`),
  },
  books: {
    list: (postcode?: string) => {
      const url = postcode ? `/api/books?postcode=${encodeURIComponent(postcode)}` : "/api/books";
      return fetchJSON<Book[]>(url);
    },
    get: (id: string) => fetchJSON<Book>(`/api/books/${id}`),
    myBooks: () => fetchJSON<Book[]>("/api/my-books"),
    create: (data: { title: string; author: string; isbn?: string; image?: string; description?: string; condition: string; type: string }) =>
      fetchJSON<Book>("/api/books", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJSON<{ success: boolean }>(`/api/books/${id}`, {
        method: "DELETE",
      }),
  },
  swaps: {
    request: (bookId: string) =>
      fetchJSON<SwapRequest>("/api/swaps/request", {
        method: "POST",
        body: JSON.stringify({ bookId }),
      }),
    accept: (id: string) =>
      fetchJSON<{ message: string }>(`/api/swaps/${id}/accept`, {
        method: "POST",
      }),
    reject: (id: string) =>
      fetchJSON<{ message: string }>(`/api/swaps/${id}/reject`, {
        method: "POST",
      }),
    complete: (id: string) =>
      fetchJSON<{ message: string }>(`/api/swaps/${id}/complete`, {
        method: "POST",
      }),
  },
  leaderboard: {
    get: (postcode: string) =>
      fetchJSON<Array<{ user: UserProfile; badges: Badge[] }>>(`/api/leaderboard/${encodeURIComponent(postcode)}`),
  },
  activeAreas: {
    get: () =>
      fetchJSON<Array<{ postcode: string; bookCount: number; userCount: number }>>("/api/active-areas"),
  },
  dashboard: {
    get: () =>
      fetchJSON<{
        booksUploaded: number;
        swapsCompleted: number;
        badgesEarned: number;
        badges: Badge[];
        subscriptionStatus: string;
      }>("/api/dashboard"),
  },
  stripe: {
    createCheckoutSession: () =>
      fetchJSON<{ url: string }>("/api/stripe/create-checkout-session", {
        method: "POST",
      }),
    cancelSubscription: () =>
      fetchJSON<{ message: string }>("/api/stripe/cancel-subscription", {
        method: "POST",
      }),
    getSubscriptionStatus: () =>
      fetchJSON<{ status: string; isActive: boolean }>("/api/stripe/subscription-status"),
  },
};
