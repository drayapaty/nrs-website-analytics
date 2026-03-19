"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AggregatedBlog } from "@/lib/types";

interface BlogsTableProps {
  blogs: AggregatedBlog[];
  onSelect?: (blogUrl: string, blogTitle: string) => void;
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

export function BlogsTable({ blogs, onSelect }: BlogsTableProps) {
  if (blogs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No blog data available
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50 hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Blog Title</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            Views
          </TableHead>
          <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 sm:table-cell">
            Recent Viewers
          </TableHead>
          <TableHead className="hidden text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 md:table-cell">
            Last Viewed
          </TableHead>
          <TableHead className="hidden text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 sm:table-cell">
            Published
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {blogs.map((blog) => {
          const latestTimestamp =
            blog.recentViewers.length > 0
              ? Math.max(...blog.recentViewers.map((v) => v.timestamp))
              : 0;

          return (
            <TableRow
              key={blog.url}
              className="border-border/50 cursor-pointer hover:bg-accent/60 transition-colors"
              onClick={() => onSelect?.(blog.url, blog.title)}
            >
              <TableCell className="max-w-[320px]">
                <span className="text-sm font-medium text-card-foreground hover:text-primary transition-colors line-clamp-2">
                  {blog.title}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="secondary"
                  className="bg-chart-2/15 text-chart-2 border-chart-2/20"
                >
                  {blog.blogPageView.toLocaleString()}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="flex items-center gap-1.5">
                  {blog.recentViewers.slice(0, 3).map((viewer, idx) => (
                    <Avatar
                      key={`${viewer.name}-${idx}`}
                      className="size-6"
                    >
                      {viewer.displayPicture ? (
                        <AvatarImage
                          src={viewer.displayPicture}
                          alt={viewer.name}
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {getInitials(
                          viewer.spiritualName || viewer.name
                        )}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {blog.recentViewers.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{blog.recentViewers.length - 3}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden text-center md:table-cell">
                <span className="text-xs text-muted-foreground">
                  {latestTimestamp > 0 ? timeAgo(latestTimestamp) : "--"}
                </span>
              </TableCell>
              <TableCell className="hidden text-center sm:table-cell">
                <span className="text-xs text-muted-foreground">
                  {blog.blogDate
                    ? new Date(blog.blogDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "--"}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
