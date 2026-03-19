"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AggregatedLecture } from "@/lib/types";

function timeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface LecturesTableProps {
  lectures: AggregatedLecture[];
  onSelect?: (lecture: AggregatedLecture) => void;
}

export function LecturesTable({ lectures, onSelect }: LecturesTableProps) {
  if (lectures.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No lecture data available
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50 hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Title</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Plays</TableHead>
          <TableHead className="hidden text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 md:table-cell">Views</TableHead>
          <TableHead className="hidden text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 sm:table-cell">Downloads</TableHead>
          <TableHead className="hidden text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 md:table-cell">Last Played</TableHead>
          <TableHead className="hidden text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 sm:table-cell">Published</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lectures.map((lecture) => (
          <TableRow
            key={lecture.id}
            className="border-border/50 cursor-pointer hover:bg-accent/60 transition-colors"
            onClick={() => onSelect?.(lecture)}
          >
            <TableCell className="max-w-[300px]">
              <span className="text-sm font-medium text-card-foreground hover:text-primary transition-colors line-clamp-2 whitespace-normal">
                {lecture.title}
              </span>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="secondary" className="bg-chart-1/15 text-chart-1 border-chart-1/20">
                {lecture.audioPlayCount.toLocaleString()}
              </Badge>
            </TableCell>
            <TableCell className="hidden text-center md:table-cell">
              <span className="text-sm text-muted-foreground">
                {lecture.audioPageView.toLocaleString()}
              </span>
            </TableCell>
            <TableCell className="hidden text-center sm:table-cell">
              <span className="text-sm text-muted-foreground">
                {lecture.downloads.toLocaleString()}
              </span>
            </TableCell>
            <TableCell className="hidden text-center md:table-cell">
              <span className="text-xs text-muted-foreground">
                {lecture.lastPlayed ? timeAgo(lecture.lastPlayed) : "--"}
              </span>
            </TableCell>
            <TableCell className="hidden text-center sm:table-cell">
              <span className="text-xs text-muted-foreground">
                {new Date(lecture.createdDateTime).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
