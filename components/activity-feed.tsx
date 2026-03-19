"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { LectureEntry, BlogPostEntry } from "@/lib/types";

type ActivityItem =
  | (LectureEntry & { _type: "lecture" })
  | (BlogPostEntry & { _type: "blog" });

interface ActivityFeedProps {
  lectures: LectureEntry[];
  blogPosts: BlogPostEntry[];
}

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

function getDisplayName(item: ActivityItem): string {
  if (item.spiritualName && item.spiritualName.trim()) {
    return item.spiritualName;
  }
  return item.legalName || "Anonymous";
}

function getContentTitle(item: ActivityItem): string {
  if (item._type === "lecture") {
    try {
      const parsed = JSON.parse(item.contentTitle);
      return parsed.en || parsed.ru || "Untitled Lecture";
    } catch {
      return item.contentTitle || "Untitled Lecture";
    }
  }
  // Blog post - use contentData for title
  return (
    item.contentData?.en?.title ||
    item.contentData?.cyr?.title ||
    "Blog Post"
  );
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
  });
}

export function ActivityFeed({ lectures, blogPosts }: ActivityFeedProps) {
  const merged: ActivityItem[] = [
    ...lectures.map((l) => ({ ...l, _type: "lecture" as const })),
    ...blogPosts.map((b) => ({ ...b, _type: "blog" as const })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp);

  if (merged.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No recent activity
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {merged.map((item, i) => (
        <div
          key={`${item.email}-${item.timestamp}-${i}`}
          className="flex items-start gap-3 border-b border-border/20 px-4 py-3.5 transition-colors last:border-0 hover:bg-accent/40"
        >
          <Avatar className="mt-0.5 size-8">
            {item.displayPicture ? (
              <AvatarImage
                src={item.displayPicture}
                alt={getDisplayName(item)}
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-xs text-primary">
              {getInitials(item.legalName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-card-foreground">
                {getDisplayName(item)}
              </span>
              <Badge
                variant="outline"
                className={
                  item._type === "lecture"
                    ? "border-chart-1/30 px-1.5 py-0 text-[10px] text-chart-1"
                    : "border-chart-2/30 px-1.5 py-0 text-[10px] text-chart-2"
                }
              >
                {item._type === "lecture" ? "played" : "viewed"}
              </Badge>
              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                {timeAgo(item.timestamp)}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {getContentTitle(item)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
