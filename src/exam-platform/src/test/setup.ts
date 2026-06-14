import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Clerk for Redux slice tests (async thunks use useAuth/getToken)
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: () => Promise.resolve("mock-token") }),
  useUser: () => ({ user: null, isLoaded: true }),
  useClerk: () => ({}),
}));

