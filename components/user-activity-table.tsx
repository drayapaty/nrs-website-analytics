"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Play,
  Eye,
  Download,
  FileText,
  Headphones,
  Video,
  Globe,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  Mail,
} from "lucide-react";
import type { UserActivityEntry, AggregatedUser } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseLectureTitle(raw?: string): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return parsed.en || parsed.ru || parsed.cyr || "";
  } catch {
    return raw;
  }
}

function timeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const RESOURCE_CONFIG: Record<string, { icon: typeof Headphones; label: string; color: string }> = {
  lecture: { icon: Headphones, label: "Lectures", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" },
  lectures: { icon: Headphones, label: "Lectures", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" },
  blogpost: { icon: FileText, label: "Blogs", color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10" },
  blog: { icon: FileText, label: "Blogs", color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10" },
  video: { icon: Video, label: "Videos", color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10" },
};

function getResourceConfig(resource: string) {
  return RESOURCE_CONFIG[resource] || { icon: Globe, label: resource || "Page", color: "text-muted-foreground bg-accent" };
}

const ACTION_CONFIG: Record<string, { icon: typeof Play; label: string }> = {
  play: { icon: Play, label: "Plays" },
  view: { icon: Eye, label: "Views" },
  download: { icon: Download, label: "Downloads" },
};

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] || { icon: Eye, label: action };
}

function getDiscipleLabel(
  disciple: number
): { label: string; className: string } | null {
  if (disciple === 1)
    return { label: "Disciple", className: "border-primary/30 text-primary" };
  if (disciple === 2)
    return {
      label: "Aspiring",
      className: "border-amber-500/30 text-amber-600 dark:text-amber-400",
    };
  return null;
}

function parseDeviceInfo(misc?: string) {
  if (!misc) return null;
  try {
    const parsed = JSON.parse(misc);
    const ua = parsed.navigatorUserAgent || "";
    const isMobile = ua.includes("Mobile") || parsed.navigatorPlatform?.includes("arm");
    const isTablet = ua.includes("iPad") || (isMobile && ua.includes("Tablet"));
    return {
      os: parsed.osName || parsed.platform || "",
      osVersion: parsed.osVersion || "",
      browser: parsed.browserName || "",
      appVersion: parsed.appVersion || "",
      isMobile,
      isTablet,
      isApp: !!parsed.platform && !parsed.browserName,
    };
  } catch {
    return null;
  }
}

// ── Aggregation ──────────────────────────────────────────────────────────────

function aggregateUsers(entries: UserActivityEntry[]): AggregatedUser[] {
  const map = new Map<string, AggregatedUser>();

  for (const entry of entries) {
    const key = entry.email;
    if (!key) continue;

    const disciple =
      typeof entry.disciple === "string"
        ? parseInt(entry.disciple, 10)
        : entry.disciple;
    const title = parseLectureTitle(entry.contentTitle);
    const existing = map.get(key);

    if (existing) {
      existing.totalEvents++;
      if (entry.timestamp > existing.lastActive) {
        existing.lastActive = entry.timestamp;
        if (entry.displayPicture) existing.displayPicture = entry.displayPicture;
      }
      existing.resourceCounts[entry.resource] =
        (existing.resourceCounts[entry.resource] || 0) + 1;
      existing.actionCounts[entry.action] =
        (existing.actionCounts[entry.action] || 0) + 1;
      if (existing.recentActivity.length < 10) {
        existing.recentActivity.push({
          resource: entry.resource,
          action: entry.action,
          url: entry.url,
          title,
          timestamp: entry.timestamp,
        });
      }
    } else {
      map.set(key, {
        email: key,
        legalName: entry.legalName,
        spiritualName: entry.spiritualName,
        displayPicture: entry.displayPicture || "",
        disciple: isNaN(disciple) ? 0 : disciple,
        totalEvents: 1,
        lastActive: entry.timestamp,
        resourceCounts: { [entry.resource]: 1 },
        actionCounts: { [entry.action]: 1 },
        recentActivity: [
          {
            resource: entry.resource,
            action: entry.action,
            url: entry.url,
            title,
            timestamp: entry.timestamp,
          },
        ],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.lastActive - a.lastActive);
}

// ── User Detail Drawer Content ───────────────────────────────────────────────

interface UserDetailEntry {
  resource: string;
  action: string;
  url: string;
  contentTitle?: string;
  misc?: string;
  timestamp: number;
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-background px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold tracking-tight text-foreground">
          {value.toLocaleString()}
        </p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function UserDrawerContent({ user }: { user: AggregatedUser }) {
  const { data, isLoading } = useSWR<{ data: UserDetailEntry[] }>(
    `/api/insights/detail?email=${encodeURIComponent(user.email)}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const entries = data?.data ?? [];

  // Compute detailed aggregates
  const stats = useMemo(() => {
    const resourceCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};
    const devices: { device: ReturnType<typeof parseDeviceInfo>; count: number }[] = [];
    const deviceMap = new Map<string, { device: ReturnType<typeof parseDeviceInfo>; count: number }>();

    for (const e of entries) {
      resourceCounts[e.resource] = (resourceCounts[e.resource] || 0) + 1;
      actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;

      const device = parseDeviceInfo(e.misc);
      if (device) {
        const key = `${device.os}-${device.browser}-${device.isApp ? "app" : "web"}`;
        const existing = deviceMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          const entry = { device, count: 1 };
          deviceMap.set(key, entry);
          devices.push(entry);
        }
      }
    }

    return { resourceCounts, actionCounts, devices: devices.sort((a, b) => b.count - a.count) };
  }, [entries]);

  // Group activity by day
  const activityByDay = useMemo(() => {
    const groups: { date: string; events: (UserDetailEntry & { parsedTitle: string })[] }[] = [];
    const dayMap = new Map<string, (UserDetailEntry & { parsedTitle: string })[]>();

    for (const e of entries) {
      const dateKey = new Date(e.timestamp).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const parsed = {
        ...e,
        parsedTitle: parseLectureTitle(e.contentTitle) || cleanUrl(e.url),
      };
      if (!dayMap.has(dateKey)) {
        const events = [parsed];
        dayMap.set(dateKey, events);
        groups.push({ date: dateKey, events });
      } else {
        dayMap.get(dateKey)!.push(parsed);
      }
    }

    return groups;
  }, [entries]);

  if (isLoading) {
    return (
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <MiniStat
          icon={<Eye className="size-4" />}
          label="Total Events"
          value={entries.length}
        />
        {(stats.actionCounts["play"] ?? 0) > 0 && (
          <MiniStat
            icon={<Play className="size-4" />}
            label="Audio Plays"
            value={stats.actionCounts["play"]}
          />
        )}
        {(stats.actionCounts["view"] ?? 0) > 0 && (
          <MiniStat
            icon={<Eye className="size-4" />}
            label="Page Views"
            value={stats.actionCounts["view"]}
          />
        )}
        {(stats.actionCounts["download"] ?? 0) > 0 && (
          <MiniStat
            icon={<Download className="size-4" />}
            label="Downloads"
            value={stats.actionCounts["download"]}
          />
        )}
      </div>

      {/* Content breakdown */}
      <Card className="gap-0 border-border/50 py-0">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm font-medium">Content Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.resourceCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([resource, count]) => {
                const config = getResourceConfig(resource);
                const Icon = config.icon;
                return (
                  <div
                    key={resource}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 ${config.color}`}
                  >
                    <Icon className="size-4" />
                    <span className="text-sm font-medium">{config.label}</span>
                    <span className="text-sm font-bold">{count}</span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Device info */}
      {stats.devices.length > 0 && (
        <Card className="gap-0 border-border/50 py-0">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Smartphone className="size-4 text-primary" />
              Devices
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-2">
              {stats.devices.slice(0, 3).map(({ device, count }, idx) => {
                if (!device) return null;
                const DeviceIcon = device.isTablet
                  ? Tablet
                  : device.isMobile
                    ? Smartphone
                    : Monitor;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg bg-accent/40 px-3 py-2"
                  >
                    <DeviceIcon className="size-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {device.isApp
                          ? `App v${device.appVersion}`
                          : device.browser || "Unknown browser"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {device.os} {device.osVersion}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {count} event{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Activity Timeline ({entries.length} events)
        </p>
        <div className="max-h-[400px] overflow-y-auto pr-1 space-y-5">
          {activityByDay.map(({ date, events }) => (
            <div key={date}>
              <div className="sticky top-0 z-10 -mx-1 px-1 py-1.5 backdrop-blur-sm bg-background/95 dark:bg-card/95 border-b border-border/30 mb-2">
                <p className="text-xs font-medium text-muted-foreground/70">
                  {date}
                </p>
              </div>
              <div className="relative ml-3 border-l border-border/50 pl-4 space-y-1">
                {events.map((evt, idx) => {
                  const config = getResourceConfig(evt.resource);
                  const actionConfig = getActionConfig(evt.action);
                  const Icon = config.icon;
                  const ActionIcon = actionConfig.icon;
                  return (
                    <div
                      key={`${evt.timestamp}-${idx}`}
                      className="relative flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/30"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[22px] top-3 size-2.5 rounded-full border-2 border-card bg-border" />
                      <div className={`flex size-7 shrink-0 items-center justify-center rounded-md ${config.color}`}>
                        <Icon className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground line-clamp-2">
                          {evt.parsedTitle}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <ActionIcon className="size-3" />
                            <span className="capitalize">{evt.action}</span>
                          </span>
                          <span className="text-[11px] text-muted-foreground/50">
                            {config.label}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground/60">
                        {new Date(evt.timestamp).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function cleanUrl(url: string): string {
  // Make URLs more readable
  if (url === "/" || url === "") return "Home Page";
  return url
    .replace(/^\/media\/lectures\//, "Lecture: ")
    .replace(/^\/media\/video\//, "Video: ")
    .replace(/^\/blog\//, "Blog: ")
    .replace(/^\/media\/video$/, "Video Library")
    .replace(/^\/media\/lectures$/, "Lecture Library")
    .replace(/^\/blog$/, "Blog")
    .replace(/^\//, "");
}

// ── Main Component ───────────────────────────────────────────────────────────

export function UserActivityTable() {
  const { data, isLoading } = useSWR<{ data: UserActivityEntry[] }>(
    "/api/insights/users",
    fetcher,
    { refreshInterval: 120000 }
  );

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AggregatedUser | null>(null);

  const users = useMemo(() => {
    const entries = data?.data ?? [];
    return aggregateUsers(entries);
  }, [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.legalName.toLowerCase().includes(q) ||
        u.spiritualName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Search */}
        <div className="relative px-2">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, spiritual name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-border/50 text-sm"
          />
        </div>

        {/* User count */}
        <div className="px-3">
          <span className="text-xs text-muted-foreground">
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* User list */}
        <div className="max-h-[500px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="mb-3 size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-0.5 px-1">
              {filtered.map((user) => {
                const badge = getDiscipleLabel(user.disciple);
                const displayName = user.spiritualName || user.legalName;

                return (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-all hover:bg-accent/40 active:scale-[0.99]"
                  >
                    {/* Large avatar */}
                    <Avatar className="size-14 ring-2 ring-orange-200 dark:ring-orange-500/20 shrink-0">
                      {user.displayPicture ? (
                        <AvatarImage
                          src={user.displayPicture}
                          alt={displayName}
                        />
                      ) : null}
                      <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 text-base font-semibold">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name and meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {displayName}
                        </span>
                        {badge && (
                          <Badge
                            variant="outline"
                            className={`px-1.5 py-0 text-[10px] shrink-0 ${badge.className}`}
                          >
                            {badge.label}
                          </Badge>
                        )}
                      </div>
                      {user.spiritualName && user.legalName && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {user.legalName}
                        </p>
                      )}
                      {/* Resource breakdown pills */}
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {Object.entries(user.resourceCounts)
                          .filter(([r]) => r)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 4)
                          .map(([resource, count]) => {
                            const config = getResourceConfig(resource);
                            const Icon = config.icon;
                            return (
                              <span
                                key={resource}
                                className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                              >
                                <Icon className="size-3" />
                                <span className="hidden sm:inline">
                                  {config.label}
                                </span>
                                <span className="font-medium text-foreground">
                                  {count}
                                </span>
                              </span>
                            );
                          })}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        {timeAgo(user.lastActive)}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {user.totalEvents} event{user.totalEvents !== 1 ? "s" : ""}
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground/40" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Detail Drawer */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)} modal={false}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-border/50 bg-card shadow-2xl sm:max-w-lg"
        >
          {selectedUser && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <Avatar className="size-28 ring-3 ring-orange-200 dark:ring-orange-500/20 shadow-lg">
                    {selectedUser.displayPicture ? (
                      <AvatarImage
                        src={selectedUser.displayPicture}
                        alt={selectedUser.spiritualName || selectedUser.legalName}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 text-3xl font-bold">
                      {getInitials(selectedUser.spiritualName || selectedUser.legalName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <SheetTitle className="text-xl leading-tight text-foreground">
                        {selectedUser.spiritualName || selectedUser.legalName}
                      </SheetTitle>
                      {(() => {
                        const b = getDiscipleLabel(selectedUser.disciple);
                        return b ? (
                          <Badge variant="outline" className={`shrink-0 px-2 py-0.5 text-xs ${b.className}`}>
                            {b.label}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                    {selectedUser.spiritualName && selectedUser.legalName && (
                      <p className="text-sm text-muted-foreground">
                        {selectedUser.legalName}
                      </p>
                    )}
                    <SheetDescription className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="size-3" />
                      {selectedUser.email}
                    </SheetDescription>
                    <p className="text-xs text-muted-foreground/60">
                      Last active {timeAgo(selectedUser.lastActive)}
                    </p>
                  </div>
                </div>
              </SheetHeader>
              <UserDrawerContent user={selectedUser} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
