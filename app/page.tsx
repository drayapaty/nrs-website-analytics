"use client";

import Image from "next/image";
import { Dashboard } from "@/components/dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

function AuthenticatedHome() {
  const { logout, userEmail } = useAuth();

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white border border-border/40 p-1">
              <Image
                src="/images/iskcon-logo.png"
                alt="ISKCON Logo"
                width={44}
                height={44}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-orange-600 dark:text-orange-400 tracking-tight text-balance">
                {"H.H. Niranjana Swami's Website Analytics"}
              </h1>
              <p className="text-sm font-semibold text-foreground">
                niranjanaswami.net
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full border border-chart-2/30 bg-chart-2/10 px-2.5 py-1 text-xs font-medium text-chart-2">
              <span className="size-1.5 rounded-full bg-chart-2 animate-pulse" />
              Live
            </span>
            <ThemeToggle />
            <div className="flex items-center gap-2 border-l border-border pl-3">
              {userEmail && (
                <span className="hidden sm:inline text-xs text-muted-foreground max-w-[140px] truncate">
                  {userEmail}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Sign Out"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Dashboard />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <AuthenticatedHome />
    </AuthGuard>
  );
}

