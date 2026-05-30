import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// src/lib/env.ts requires VITE_API_BASE_URL at module load. The CI Test step
// does not provide it (only Build does), so suites importing env.ts (AuthContext,
// xss) throw "Missing required env var". Provide test defaults before any module
// loads. setupFiles run before the test module graph is imported.
vi.stubEnv("VITE_API_BASE_URL", "http://test.local");
vi.stubEnv("VITE_ENV", "development");
