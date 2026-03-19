"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import {
  signIn as amplifySignIn,
  completeNewPassword as amplifyNewPassword,
  checkUser,
  signOut as amplifySignOut,
  forgotPassword as amplifyForgotPassword,
  resetPasswordWithCode as amplifyResetPassword,
  setupTOTP,
  verifyTotpToken,
  setPreferredMFA,
  confirmSignIn as amplifyConfirmSignIn,
} from "@/lib/amplify";

/* ── Types ── */

interface AuthState {
  authorized: boolean;
  loading: boolean;
  error: string | null;
  challengeStep:
    | "IDLE"
    | "NEW_PASSWORD"
    | "MFA_SETUP"
    | "MFA_INPUT"
    | "FORGOT_SENT"
    | "FORGOT_RESET_SUCCESS";
  cognitoUser: any;
  qrCodeURL: string;
  secretCode: string;
  userEmail: string;
}

type AuthAction =
  | { type: "LOADING" }
  | { type: "AUTH_SUCCESS"; email: string }
  | { type: "AUTH_FAILED"; error?: string }
  | { type: "CHALLENGE"; step: AuthState["challengeStep"]; cognitoUser?: any; qrCodeURL?: string; secretCode?: string }
  | { type: "FORGOT_SENT"; email: string }
  | { type: "FORGOT_RESET_SUCCESS" }
  | { type: "LOGOUT" }
  | { type: "SET_ERROR"; error: string };

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  submitNewPassword: (newPassword: string) => Promise<void>;
  verifyMFASetup: (code: string) => Promise<void>;
  enterMFA: (code: string) => Promise<void>;
  requestForgotPassword: (email: string) => Promise<void>;
  submitResetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

/* ── Reducer ── */

const initialState: AuthState = {
  authorized: false,
  loading: true, // true until initial session check completes
  error: null,
  challengeStep: "IDLE",
  cognitoUser: null,
  qrCodeURL: "",
  secretCode: "",
  userEmail: "",
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: true, error: null };
    case "AUTH_SUCCESS":
      return {
        ...state,
        authorized: true,
        loading: false,
        error: null,
        challengeStep: "IDLE",
        cognitoUser: null,
        qrCodeURL: "",
        secretCode: "",
        userEmail: action.email,
      };
    case "AUTH_FAILED":
      return {
        ...state,
        authorized: false,
        loading: false,
        error: action.error || null,
        challengeStep: "IDLE",
        cognitoUser: null,
      };
    case "CHALLENGE":
      return {
        ...state,
        loading: false,
        challengeStep: action.step,
        cognitoUser: action.cognitoUser ?? state.cognitoUser,
        qrCodeURL: action.qrCodeURL ?? state.qrCodeURL,
        secretCode: action.secretCode ?? state.secretCode,
      };
    case "FORGOT_SENT":
      return {
        ...state,
        loading: false,
        challengeStep: "FORGOT_SENT",
        userEmail: action.email,
        error: null,
      };
    case "FORGOT_RESET_SUCCESS":
      return {
        ...state,
        loading: false,
        challengeStep: "FORGOT_RESET_SUCCESS",
        error: null,
      };
    case "LOGOUT":
      return { ...initialState, loading: false };
    case "SET_ERROR":
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}

/* ── Context ── */

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

/* ── Local storage helpers ── */

function persistAuth(email: string) {
  try {
    localStorage.setItem("authUser", JSON.stringify({ email }));
  } catch {}
}

function clearAuth() {
  try {
    localStorage.removeItem("authUser");
  } catch {}
}

/* ── Provider ── */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check existing session on mount
  useEffect(() => {
    checkUser()
      .then((user: any) => {
        const email = user?.attributes?.email || user?.username || "";
        persistAuth(email);
        dispatch({ type: "AUTH_SUCCESS", email });
      })
      .catch(() => {
        clearAuth();
        dispatch({ type: "AUTH_FAILED" });
      });
  }, []);

  /* ── Helper to handle Cognito challenge responses ── */
  const handleChallengeUser = useCallback(async (user: any) => {
    if (user.challengeName === "MFA_SETUP") {
      const secret = await setupTOTP(user);
      dispatch({
        type: "CHALLENGE",
        step: "MFA_SETUP",
        cognitoUser: user,
        secretCode: secret,
        qrCodeURL: `otpauth://totp/AWSCognito:${user.username}?secret=${secret}&issuer=NRSAnalytics`,
      });
      return;
    }
    if (user.challengeName === "SOFTWARE_TOKEN_MFA") {
      dispatch({ type: "CHALLENGE", step: "MFA_INPUT", cognitoUser: user });
      return;
    }
    if (user.challengeName === "NEW_PASSWORD_REQUIRED") {
      dispatch({ type: "CHALLENGE", step: "NEW_PASSWORD", cognitoUser: user });
      return;
    }
    // No challenge — success
    const email = user?.attributes?.email || user?.username || "";
    persistAuth(email);
    dispatch({ type: "AUTH_SUCCESS", email });
  }, []);

  /* ── Actions ── */

  const login = useCallback(
    async (email: string, password: string) => {
      dispatch({ type: "LOADING" });
      try {
        const user = await amplifySignIn(email, password);
        await handleChallengeUser(user);
      } catch (err: any) {
        dispatch({ type: "SET_ERROR", error: err.message || "Login failed" });
      }
    },
    [handleChallengeUser]
  );

  const submitNewPassword = useCallback(
    async (newPassword: string) => {
      dispatch({ type: "LOADING" });
      try {
        const user = await amplifyNewPassword(state.cognitoUser, newPassword);
        await handleChallengeUser(user);
      } catch (err: any) {
        dispatch({
          type: "SET_ERROR",
          error: err.message || "Password change failed",
        });
      }
    },
    [state.cognitoUser, handleChallengeUser]
  );

  const verifyMFASetup = useCallback(
    async (code: string) => {
      dispatch({ type: "LOADING" });
      try {
        await verifyTotpToken(state.cognitoUser, code);
        await setPreferredMFA(state.cognitoUser, "TOTP");
        const user = await checkUser();
        const email = user?.attributes?.email || user?.username || "";
        persistAuth(email);
        dispatch({ type: "AUTH_SUCCESS", email });
      } catch (err: any) {
        dispatch({
          type: "SET_ERROR",
          error: err.message || "MFA verification failed",
        });
      }
    },
    [state.cognitoUser]
  );

  const enterMFA = useCallback(
    async (code: string) => {
      dispatch({ type: "LOADING" });
      try {
        await amplifyConfirmSignIn(state.cognitoUser, code);
        const user = await checkUser();
        const email = user?.attributes?.email || user?.username || "";
        persistAuth(email);
        dispatch({ type: "AUTH_SUCCESS", email });
      } catch (err: any) {
        dispatch({
          type: "SET_ERROR",
          error: err.message || "MFA verification failed",
        });
      }
    },
    [state.cognitoUser]
  );

  const requestForgotPassword = useCallback(async (email: string) => {
    dispatch({ type: "LOADING" });
    try {
      await amplifyForgotPassword(email);
      dispatch({ type: "FORGOT_SENT", email });
    } catch (err: any) {
      dispatch({
        type: "SET_ERROR",
        error: err.message || "Could not send reset code",
      });
    }
  }, []);

  const submitResetPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      dispatch({ type: "LOADING" });
      try {
        await amplifyResetPassword(email, code, newPassword);
        dispatch({ type: "FORGOT_RESET_SUCCESS" });
      } catch (err: any) {
        dispatch({
          type: "SET_ERROR",
          error: err.message || "Password reset failed",
        });
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await amplifySignOut();
    clearAuth();
    dispatch({ type: "LOGOUT" });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    submitNewPassword,
    verifyMFASetup,
    enterMFA,
    requestForgotPassword,
    submitResetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
