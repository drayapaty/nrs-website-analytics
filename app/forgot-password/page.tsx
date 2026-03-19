"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Loader2, Mail, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { loading, error, challengeStep, requestForgotPassword, submitResetPassword } =
    useAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestForgotPassword(email);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match");
      return;
    }
    setPwError("");
    await submitResetPassword(email, code, newPw);
  };

  /* ── Step 1: Request OTP ── */
  const renderRequestForm = () => (
    <form onSubmit={handleRequestOtp} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter your email address and we'll send a verification code to reset your password.
      </p>
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
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          "Send Verification Code"
        )}
      </Button>
    </form>
  );

  /* ── Step 2: Enter code + new password ── */
  const renderResetForm = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        A verification code has been sent to <strong>{email}</strong>. Enter it below along with your new password.
      </p>
      <div className="space-y-2">
        <Label htmlFor="code">Verification Code</Label>
        <Input
          id="code"
          type="text"
          placeholder="Enter code"
          className="text-center tracking-widest"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-pw">New Password</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="new-pw"
            type="password"
            className="pl-9"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-pw">Confirm Password</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirm-pw"
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
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting…
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  );

  /* ── Step 3: Success ── */
  const renderSuccess = () => (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
      </div>
      <p className="text-sm text-muted-foreground">
        Your password has been successfully reset. Please sign in with your new password.
      </p>
      <Button className="w-full" onClick={() => router.push("/login")}>
        Back to Sign In
      </Button>
    </div>
  );

  const isForgotSent = challengeStep === "FORGOT_SENT";
  const isResetSuccess = challengeStep === "FORGOT_RESET_SUCCESS";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-background to-amber-50 dark:from-neutral-950 dark:via-background dark:to-neutral-900 px-4">
      <Card className="w-full max-w-md shadow-xl border-border/50 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-xl">
            {isResetSuccess ? "Password Reset" : "Forgot Password"}
          </CardTitle>
          <CardDescription>
            {isResetSuccess
              ? "All done!"
              : isForgotSent
              ? "Enter verification code"
              : "Recover your account access"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {isResetSuccess
            ? renderSuccess()
            : isForgotSent
            ? renderResetForm()
            : renderRequestForm()}

          {!isResetSuccess && (
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Back to Sign In
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
