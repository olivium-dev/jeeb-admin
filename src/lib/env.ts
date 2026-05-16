const required = (key: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export const env = {
  apiBaseUrl: required("VITE_API_BASE_URL", import.meta.env.VITE_API_BASE_URL),
  env: (import.meta.env.VITE_ENV ?? "development") as
    | "development"
    | "staging"
    | "production",
} as const;
