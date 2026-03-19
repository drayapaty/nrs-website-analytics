"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Lock, Mail, KeyRound, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const {
    authorized,
    loading,
    error,
    challengeStep,
    qrCodeURL,
    secretCode,
    login,
    submitNewPassword,
    verifyMFASetup,
    enterMFA,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (authorized) router.replace("/");
  }, [authorized, router]);

  if (authorized) return null;

  /* ── Handlers ── */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match");
      return;
    }
    setPwError("");
    await submitNewPassword(newPw);
  };

  const handleMFASetup = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyMFASetup(mfaCode);
  };

  const handleMFAInput = async (e: React.FormEvent) => {
    e.preventDefault();
    await enterMFA(mfaCode);
  };

  /* ── Render helpers ── */

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            className="pl-9"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="pl-9"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </Button>
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );

  const renderNewPasswordForm = () => (
    <form onSubmit={handleNewPassword} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        You must set a new password before continuing.
      </p>
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="new-password"
            type="password"
            className="pl-9"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirm-password"
            type="password"
            className="pl-9"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            required
          />
        </div>
      </div>
      {pwError && (
        <p className="text-sm text-destructive">{pwError}</p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting password…
          </>
        ) : (
          "Set New Password"
        )}
      </Button>
    </form>
  );

  const renderMFASetup = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Set up Two-Factor Authentication
        </p>
        <p className="text-sm text-muted-foreground">
          Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code.
        </p>
      </div>
      {qrCodeURL && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <QRCodeSVG value={qrCodeURL} size={180} />
          <p className="text-xs text-muted-foreground break-all max-w-[280px] text-center">
            Manual key: <code className="font-mono text-foreground">{secretCode}</code>
          </p>
        </div>
      )}
      <form onSubmit={handleMFASetup} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="mfa-code">Verification Code</Label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="mfa-code"
              type="text"
              placeholder="000000"
              className="pl-9 text-center tracking-widest"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
            </>
          ) : (
            "Verify & Enable MFA"
          )}
        </Button>
      </form>
    </div>
  );

  const renderMFAInput = () => (
    <form onSubmit={handleMFAInput} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code from your authenticator app.
      </p>
      <div className="space-y-2">
        <Label htmlFor="mfa-verify">Authentication Code</Label>
        <div className="relative">
          <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="mfa-verify"
            type="text"
            placeholder="000000"
            className="pl-9 text-center tracking-widest"
            maxLength={6}
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
          </>
        ) : (
          "Verify Code"
        )}
      </Button>
    </form>
  );

  /* ── Card titles ── */

  const getTitle = () => {
    switch (challengeStep) {
      case "NEW_PASSWORD":
        return "Set New Password";
      case "MFA_SETUP":
        return "Two-Factor Authentication Setup";
      case "MFA_INPUT":
        return "Two-Factor Authentication";
      default:
        return "Sign In";
    }
  };

  const getDescription = () => {
    switch (challengeStep) {
      case "NEW_PASSWORD":
        return "Please set a new password to continue";
      case "MFA_SETUP":
        return "Enhance your account security";
      case "MFA_INPUT":
        return "Enter your authentication code";
      default:
        return "Welcome to H.H. Niranjana Swami's Website Analytics";
    }
  };

  /* ── Main render ── */

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-background to-amber-50 dark:from-neutral-950 dark:via-background dark:to-neutral-900 px-4">
      <Card className="w-full max-w-md shadow-xl border-border/50 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
            <Lock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-xl">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {challengeStep === "NEW_PASSWORD" && renderNewPasswordForm()}
          {challengeStep === "MFA_SETUP" && renderMFASetup()}
          {challengeStep === "MFA_INPUT" && renderMFAInput()}
          {challengeStep === "IDLE" && renderLoginForm()}
        </CardContent>
      </Card>
    </div>
  );
}
