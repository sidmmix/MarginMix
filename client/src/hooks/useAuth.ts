import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/react";

export function useAuth() {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  const redirectToSignIn = async (_credentials?: unknown) => {
    window.location.assign("/sign-in");
  };

  const redirectToSignUp = async (_details?: unknown) => {
    window.location.assign("/sign-up");
  };

  return {
    user,
    isLoading: !isLoaded,
    error: null,
    isAuthenticated: isSignedIn === true,
    login: redirectToSignIn,
    register: redirectToSignUp,
    logout: () => signOut({ redirectUrl: "/" }),
    isLoggingIn: false,
    isRegistering: false,
    isLoggingOut: false,
    loginError: null as Error | null,
    registerError: null as Error | null,
  };
}