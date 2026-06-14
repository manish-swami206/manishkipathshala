const configuredClerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY;

export const isClerkConfigured = Boolean(configuredClerkPublishableKey);

export const clerkPublishableKey =
  configuredClerkPublishableKey ?? "pk_test_local_development_placeholder";
