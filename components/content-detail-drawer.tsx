"use client";

import { useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Play,
  Eye,
  Download,
  Clock,
  Smartphone,
  Monitor,
  Globe,
  ExternalLink,
  Loader2,
  UserCheck,
  UserX,
  Tablet,
  Cpu,
} from "lucide-react";
import type { AggregatedLecture } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface MiscWeb {
  osName?: string;
  osVersion?: number | string;
  browserName?: string;
  navigatorPlatform?: string;
  navigatorUserAgent?: string;
  referrer?: string;
}

interface MiscApp {
  platform?: string;
  specs?: string;
  appVersion?: string;
}

type MiscData = MiscWeb & MiscApp;

interface DetailEntry {
  resource: string;
  url: string;
  misc: string;
  user_id: string;
  spiritualName: string;
  email: string;
  displayPicture?: string;
  disciple: number;
  legalName: string;
  contentTitle?: string;
  contentDate?: string;
  action: string;
  platform?: string;
  id: string;
  timestamp: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getInitials(name: string): string {
  if (!name || !name.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeAgo(ts: number): string {
  const now = Date.now();
  const diffMs = now - ts;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseMisc(raw: string): MiscData {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Parse device specs from app platform string
 * e.g. "DeviceSpecs(deviceModel=SM-S926B, systemVersion=36, manufacturer=samsung)"
 */
function parseSpecs(specs?: string): {
  model: string;
  manufacturer: string;
  systemVersion: string;
} {
  if (!specs) return { model: "Unknown", manufacturer: "Unknown", systemVersion: "" };
  const modelMatch = specs.match(/deviceModel=([^,)]+)/);
  const mfrMatch = specs.match(/manufacturer=([^,)]+)/);
  const verMatch = specs.match(/systemVersion=([^,)]+)/);
  return {
    model: modelMatch?.[1] || "Unknown",
    manufacturer: mfrMatch?.[1] || "Unknown",
    systemVersion: verMatch?.[1] || "",
  };
}

function getPlatform(entry: DetailEntry, misc: MiscData): string {
  // App-based entries have a top-level platform field
  if (entry.platform) return entry.platform;
  // Or misc.platform
  if (misc.platform) return misc.platform;
  // Web-based entries
  if (misc.osName) return normalizeOS(misc.osName);
  return "Unknown";
}

function normalizeOS(osName?: string): string {
  if (!osName) return "Unknown";
  const lower = osName.toLowerCase();
  if (lower.includes("iphone") || lower.includes("ios")) return "iOS";
  if (lower.includes("android")) return "Android";
  if (lower.includes("mac")) return "macOS";
  if (lower.includes("windows")) return "Windows";
  if (lower.includes("linux")) return "Linux";
  return osName;
}

function getDeviceType(entry: DetailEntry, misc: MiscData): string {
  // App platform
  if (entry.platform || misc.platform) {
    const p = (entry.platform || misc.platform || "").toLowerCase();
    if (p === "android" || p === "ios") return "Mobile";
    if (p === "web") return "Desktop";
    return "Mobile";
  }
  // Web-based
  const platform = (misc.navigatorPlatform || "").toLowerCase();
  const ua = (misc.navigatorUserAgent || "").toLowerCase();
  const os = (misc.osName || "").toLowerCase();

  if (
    os.includes("iphone") ||
    os.includes("android") ||
    platform.includes("iphone") ||
    ua.includes("mobile")
  )
    return "Mobile";
  if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet";
  return "Desktop";
}

function getDeviceIcon(type: string) {
  if (type === "Mobile") return <Smartphone className="size-3.5" />;
  if (type === "Tablet") return <Tablet className="size-3.5" />;
  return <Monitor className="size-3.5" />;
}

function getBrowserOrApp(misc: MiscData): string {
  // App-based
  if (misc.appVersion) return `App v${misc.appVersion}`;
  // Web-based
  return misc.browserName || "Unknown";
}

// Colors
const CHART_COLORS = {
  teal: "#3ab7bf",
  green: "#4ade80",
  blue: "#60a5fa",
  amber: "#fbbf24",
  rose: "#fb7185",
  slate: "#94a3b8",
  purple: "#a78bfa",
  cyan: "#22d3ee",
  orange: "#fb923c",
};

const PLATFORM_COLORS: Record<string, string> = {
  Android: "#4ade80",
  iOS: "#3ab7bf",
  macOS: "#94a3b8",
  Windows: "#60a5fa",
  Linux: "#fbbf24",
  Web: "#a78bfa",
  Unknown: "#64748b",
};

const DEVICE_COLORS: Record<string, string> = {
  Mobile: "#3ab7bf",
  Tablet: "#a78bfa",
  Desktop: "#94a3b8",
};

const BROWSER_COLORS: Record<string, string> = {
  Chrome: "#60a5fa",
  Safari: "#3ab7bf",
  Firefox: "#fb923c",
  Edge: "#4ade80",
  Opera: "#fb7185",
  Samsung: "#a78bfa",
  Unknown: "#64748b",
};

// ── Mini Stat ───────────────────────────────────────────────────────────────

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-accent/50 px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
      </div>
    </div>
  );
}

// ── Breakdown Bar ───────────────────────────────────────────────────────────

function BreakdownBar({
  data,
  total,
}: {
  data: { name: string; value: number; color: string }[];
  total: number;
}) {
  if (total === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {data.map((d) => (
          <div
            key={d.name}
            className="h-full transition-all"
            style={{
              width: `${(d.value / total) * 100}%`,
              backgroundColor: d.color,
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-medium text-foreground">
              {d.value} ({Math.round((d.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Detail Content ────────────────────────────────────────────────────────

function DetailContent({
  entries,
  type,
  lecture,
}: {
  entries: DetailEntry[];
  type: "lecture" | "blog";
  lecture?: AggregatedLecture;
}) {
  const enriched = useMemo(
    () =>
      entries.map((e) => ({
        ...e,
        parsed: parseMisc(e.misc),
      })),
    [entries]
  );

  // Unique users
  const uniqueUsers = useMemo(() => {
    const map = new Map<
      string,
      {
        email: string;
        legalName: string;
        spiritualName: string;
        displayPicture: string;
        disciple: number;
        timestamps: number[];
        devices: string[];
        platforms: string[];
        browserOrApp: string[];
        deviceModels: string[];
        actions: string[];
      }
    >();
    for (const e of enriched) {
      const key = e.email || e.user_id;
      const device = getDeviceType(e, e.parsed);
      const platform = getPlatform(e, e.parsed);
      const browserOrApp = getBrowserOrApp(e.parsed);
      const specs = parseSpecs(e.parsed.specs);
      const model = specs.manufacturer !== "Unknown" ? `${specs.manufacturer} ${specs.model}` : "";

      const existing = map.get(key);
      if (existing) {
        existing.timestamps.push(e.timestamp);
        if (!existing.devices.includes(device)) existing.devices.push(device);
        if (!existing.platforms.includes(platform)) existing.platforms.push(platform);
        if (!existing.browserOrApp.includes(browserOrApp))
          existing.browserOrApp.push(browserOrApp);
        if (model && !existing.deviceModels.includes(model))
          existing.deviceModels.push(model);
        if (!existing.actions.includes(e.action))
          existing.actions.push(e.action);
      } else {
        map.set(key, {
          email: e.email,
          legalName: e.legalName,
          spiritualName: e.spiritualName,
          displayPicture: e.displayPicture || "",
          disciple: e.disciple,
          timestamps: [e.timestamp],
          devices: [device],
          platforms: [platform],
          browserOrApp: [browserOrApp],
          deviceModels: model ? [model] : [],
          actions: [e.action],
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => Math.max(...b.timestamps) - Math.max(...a.timestamps)
    );
  }, [enriched]);

  // Action type breakdown
  const actionBreakdown = useMemo(() => {
    const ACTION_COLORS: Record<string, string> = {
      play: CHART_COLORS.teal,
      view: CHART_COLORS.blue,
      download: CHART_COLORS.green,
      share: CHART_COLORS.amber,
    };
    const counts: Record<string, number> = {};
    for (const e of enriched) {
      const action = e.action || "unknown";
      counts[action] = (counts[action] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: ACTION_COLORS[name] || "#64748b",
      }))
      .sort((a, b) => b.value - a.value);
  }, [enriched]);

  // Platform breakdown (Android / iOS / macOS / Windows)
  const platformBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of enriched) {
      const platform = getPlatform(e, e.parsed);
      counts[platform] = (counts[platform] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: PLATFORM_COLORS[name] || "#64748b",
      }))
      .sort((a, b) => b.value - a.value);
  }, [enriched]);

  // Device type breakdown (Mobile / Desktop / Tablet)
  const deviceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of enriched) {
      const device = getDeviceType(e, e.parsed);
      counts[device] = (counts[device] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: DEVICE_COLORS[name] || "#64748b",
      }))
      .sort((a, b) => b.value - a.value);
  }, [enriched]);

  // Browser/App breakdown
  const browserBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of enriched) {
      const browser = getBrowserOrApp(e.parsed);
      counts[browser] = (counts[browser] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color:
          BROWSER_COLORS[name] ||
          (name.startsWith("App") ? "#22d3ee" : "#64748b"),
      }))
      .sort((a, b) => b.value - a.value);
  }, [enriched]);

  // Device manufacturer breakdown (for app-based entries)
  const manufacturerBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of enriched) {
      const specs = parseSpecs(e.parsed.specs);
      if (specs.manufacturer !== "Unknown") {
        const name =
          specs.manufacturer.charAt(0).toUpperCase() +
          specs.manufacturer.slice(1);
        counts[name] = (counts[name] || 0) + 1;
      }
    }
    if (Object.keys(counts).length === 0) return [];
    const colorList = [
      "#3ab7bf",
      "#4ade80",
      "#60a5fa",
      "#fbbf24",
      "#fb7185",
      "#a78bfa",
      "#22d3ee",
      "#fb923c",
    ];
    return Object.entries(counts)
      .map(([name, value], i) => ({
        name,
        value,
        color: colorList[i % colorList.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [enriched]);

  // Disciple breakdown: 0 = Not a Disciple, 1 = Disciple, 2 = Aspiring Disciple
  const discipleCount = uniqueUsers.filter((u) => u.disciple === 1).length;
  const aspiringCount = uniqueUsers.filter((u) => u.disciple === 2).length;
  const nonDiscipleCount = uniqueUsers.filter((u) => u.disciple === 0).length;
  const unknownCount = uniqueUsers.length - discipleCount - aspiringCount - nonDiscipleCount;

  // Activity by day
  const activityByDay = useMemo(() => {
    const dayMap = new Map<string, number>();
    for (const e of enriched) {
      const day = new Date(e.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    }
    return Array.from(dayMap.entries()).map(([day, count]) => ({ day, count }));
  }, [enriched]);

  // Lecture-specific engagement
  const engagementData =
    type === "lecture" && lecture
      ? [
          {
            name: "Audio Plays",
            value: lecture.audioPlayCount,
            color: CHART_COLORS.teal,
          },
          {
            name: "Page Views",
            value: lecture.audioPageView,
            color: CHART_COLORS.blue,
          },
          {
            name: "Downloads",
            value: lecture.downloads,
            color: CHART_COLORS.green,
          },
          {
            name: "Video Views",
            value: lecture.videoPageView,
            color: CHART_COLORS.amber,
          },
          {
            name: "EN Summary",
            value: lecture.enSummaryView,
            color: CHART_COLORS.purple,
          },
          {
            name: "RU Summary",
            value: lecture.ruSummaryView,
            color: CHART_COLORS.rose,
          },
          {
            name: "EN Transcript",
            value: lecture.enTranscriptionView,
            color: CHART_COLORS.cyan,
          },
          {
            name: "RU Transcript",
            value: lecture.ruTranscriptionView,
            color: CHART_COLORS.slate,
          },
        ].filter((d) => d.value > 0)
      : [];

  const totalEngagement = engagementData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        {type === "lecture" && lecture ? (
          <>
            <MiniStat
              icon={<Play className="size-4" />}
              label="Audio Plays"
              value={lecture.audioPlayCount}
            />
            <MiniStat
              icon={<Eye className="size-4" />}
              label="Page Views"
              value={lecture.audioPageView}
            />
            <MiniStat
              icon={<Download className="size-4" />}
              label="Downloads"
              value={lecture.downloads}
            />
            <MiniStat
              icon={<Users className="size-4" />}
              label="Unique Users"
              value={uniqueUsers.length}
            />
          </>
        ) : (
          <>
            <MiniStat
              icon={<Eye className="size-4" />}
              label="Total Views"
              value={entries.length}
            />
            <MiniStat
              icon={<Users className="size-4" />}
              label="Unique Viewers"
              value={uniqueUsers.length}
            />
            <MiniStat
              icon={<UserCheck className="size-4" />}
              label="Disciples"
              value={discipleCount}
            />
            <MiniStat
              icon={<Users className="size-4" />}
              label="Aspiring"
              value={aspiringCount}
            />
          </>
        )}
      </div>

      {/* Engagement Breakdown - Lectures only */}
      {engagementData.length > 0 && (
        <Card className="gap-0 border-border/50 py-0">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-medium">
              Engagement Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <BreakdownBar data={engagementData} total={totalEngagement} />
          </CardContent>
        </Card>
      )}

      {/* Action Type Breakdown */}
      {actionBreakdown.length > 1 && (
        <Card className="gap-0 border-border/50 py-0">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Play className="size-4 text-primary" />
              Action Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <BreakdownBar
              data={actionBreakdown}
              total={enriched.length}
            />
          </CardContent>
        </Card>
      )}

      {/* Device Type */}
      <Card className="gap-0 border-border/50 py-0">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Smartphone className="size-4 text-primary" />
            Device Type
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <BreakdownBar
            data={deviceBreakdown}
            total={enriched.length}
          />
        </CardContent>
      </Card>

      {/* Platform / OS */}
      <Card className="gap-0 border-border/50 py-0">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Globe className="size-4 text-primary" />
            Platform / OS
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <BreakdownBar
            data={platformBreakdown}
            total={enriched.length}
          />
        </CardContent>
      </Card>

      {/* Browser / App Version */}
      <Card className="gap-0 border-border/50 py-0">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Monitor className="size-4 text-primary" />
            {browserBreakdown.some((b) => b.name.startsWith("App"))
              ? "Browser & App"
              : "Browser"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <BreakdownBar
            data={browserBreakdown}
            total={enriched.length}
          />
        </CardContent>
      </Card>

      {/* Device Manufacturer (app-based only) */}
      {manufacturerBreakdown.length > 0 && (
        <Card className="gap-0 border-border/50 py-0">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Cpu className="size-4 text-primary" />
              Device Manufacturer
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <BreakdownBar
              data={manufacturerBreakdown}
              total={manufacturerBreakdown.reduce((s, d) => s + d.value, 0)}
            />
          </CardContent>
        </Card>
      )}

      {/* Disciple Status */}
      <Card className="gap-0 border-border/50 py-0">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <UserCheck className="size-4 text-primary" />
            Disciple Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <BreakdownBar
            data={[
              { name: "Disciples", value: discipleCount, color: CHART_COLORS.teal },
              { name: "Aspiring", value: aspiringCount, color: CHART_COLORS.amber },
              { name: "Not Disciple", value: nonDiscipleCount, color: CHART_COLORS.slate },
              ...(unknownCount > 0
                ? [{ name: "Unknown", value: unknownCount, color: "#475569" }]
                : []),
            ].filter((d) => d.value > 0)}
            total={uniqueUsers.length}
          />
        </CardContent>
      </Card>

      {/* Activity Timeline - Lectures only */}
      {type === "lecture" && activityByDay.length > 1 && (
        <Card className="gap-0 border-border/50 py-0">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="size-4 text-primary" />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-end gap-1" style={{ height: 60 }}>
              {activityByDay.map((d) => {
                const maxCount = Math.max(
                  ...activityByDay.map((x) => x.count)
                );
                const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={d.day}
                    className="group relative flex flex-1 flex-col items-center"
                  >
                    <div
                      className="w-full rounded-sm bg-primary/80 transition-colors group-hover:bg-primary"
                      style={{
                        height: `${height}%`,
                        minHeight: d.count > 0 ? 4 : 0,
                      }}
                    />
                    <span className="mt-1 text-[9px] text-muted-foreground">
                      {d.day}
                    </span>
                    <span className="absolute -top-4 rounded bg-card px-1 text-[9px] text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {d.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="bg-border/50" />

      {/* Users List */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <Users className="size-4 text-primary" />
          Users ({uniqueUsers.length})
        </h3>
        <div className="flex flex-col gap-0">
          {uniqueUsers.map((user, idx) => {
            const displayName =
              user.spiritualName && user.spiritualName.trim()
                ? user.spiritualName
                : user.legalName;
            const secondaryName =
              user.spiritualName && user.spiritualName.trim()
                ? user.legalName
                : "";

            return (
              <div
                key={user.email || idx}
                className="flex items-start gap-3 border-b border-border/20 py-2.5 last:border-0"
              >
                <Avatar className="mt-0.5 size-8">
                  {user.displayPicture ? (
                    <AvatarImage
                      src={user.displayPicture}
                      alt={displayName}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {displayName}
                    </span>
                    {user.disciple === 1 && (
                      <Badge
                        variant="outline"
                        className="border-primary/30 px-1.5 py-0 text-[10px] text-primary"
                      >
                        Disciple
                      </Badge>
                    )}
                    {user.disciple === 2 && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 px-1.5 py-0 text-[10px] text-amber-600 dark:text-amber-400"
                      >
                        Aspiring
                      </Badge>
                    )}
                  </div>
                  {secondaryName && (
                    <span className="truncate text-xs text-muted-foreground">
                      {secondaryName}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="truncate">{user.email}</span>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1">
                      {getDeviceIcon(user.devices[0])}
                      {user.platforms.join(", ")}
                    </span>
                    <span className="text-border">|</span>
                    <span>{user.browserOrApp.join(", ")}</span>
                  </div>
                  {user.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {user.actions.map((action) => (
                        <Badge
                          key={action}
                          variant="outline"
                          className="px-1.5 py-0 text-[9px] border-border/50 text-muted-foreground"
                        >
                          {action}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {user.deviceModels.length > 0 && (
                    <span className="text-[10px] text-muted-foreground/70">
                      {user.deviceModels.join(", ")}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground/70">
                    {user.timestamps.length} interaction
                    {user.timestamps.length !== 1 ? "s" : ""} -- last:{" "}
                    {timeAgo(Math.max(...user.timestamps))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────

interface ContentDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "lecture" | "blog";
  lecture?: AggregatedLecture;
  blogUrl?: string;
  blogTitle?: string;
}

export function ContentDetailDrawer({
  open,
  onOpenChange,
  type,
  lecture,
  blogUrl,
  blogTitle,
}: ContentDetailDrawerProps) {
  // Build the fetch URL for the detail API - fetch ALL actions for complete user list
  const detailUrl = useMemo(() => {
    if (!open) return null;
    if (type === "lecture" && lecture) {
      return `/api/insights/detail?url=${encodeURIComponent(lecture.url)}`;
    }
    if (type === "blog" && blogUrl) {
      return `/api/insights/detail?url=${encodeURIComponent(blogUrl)}`;
    }
    return null;
  }, [open, type, lecture, blogUrl]);

  const { data, isLoading } = useSWR<{ data: DetailEntry[] }>(
    detailUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  const title =
    type === "lecture" ? lecture?.title || "Lecture Details" : blogTitle || "Blog Details";

  const siteUrl =
    type === "lecture" && lecture
      ? `https://niranjanaswami.net${lecture.url}`
      : blogUrl
        ? `https://niranjanaswami.net${blogUrl}`
        : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-border/50 bg-card shadow-2xl sm:max-w-lg"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="pr-6 text-base leading-snug text-foreground">
            {title}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2 text-xs text-muted-foreground">
            {type === "lecture" ? "Lecture Analytics" : "Blog Analytics"}
            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                View on site
                <ExternalLink className="size-3" />
              </a>
            )}
          </SheetDescription>
        </SheetHeader>

        <Separator className="bg-border/50" />

        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Loading analytics data...
              </span>
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <DetailContent
              entries={data.data}
              type={type}
              lecture={lecture}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Users className="size-8" />
              <span className="text-sm">No detail data available</span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
