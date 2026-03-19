"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Headphones,
  FileText,
  Users,
  Download,
  Eye,
  Play,
  RefreshCw,
  Activity,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { LecturesTable } from "@/components/lectures-table";
import { BlogsTable } from "@/components/blogs-table";
import { UserActivityTable } from "@/components/user-activity-table";
import { ActivityFeed } from "@/components/activity-feed";
import { ContentDetailDrawer } from "@/components/content-detail-drawer";
import type {
  LectureEntry,
  BlogPostEntry,
  ApiResponse,
  AggregatedLecture,
  AggregatedBlog,
} from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function parseLectureTitle(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return parsed.en || parsed.ru || "Untitled";
  } catch {
    return raw || "Untitled";
  }
}

function aggregateLectures(entries: LectureEntry[]): AggregatedLecture[] {
  const map = new Map<string, AggregatedLecture & { _emails: Set<string> }>();

  for (const entry of entries) {
    const id = entry.contentData?._id || entry.url;
    const existing = map.get(id);
    const counters = entry.contentData?.counters;

    if (existing) {
      existing.totalPlays++;
      existing._emails.add(entry.email);
      existing.uniqueListeners = existing._emails.size;
      // Track most recent play
      if (entry.timestamp > existing.lastPlayed)
        existing.lastPlayed = entry.timestamp;
      // Use the highest counter values (real-time counters can differ between entries)
      if ((counters?.audioPlayCount ?? 0) > existing.audioPlayCount)
        existing.audioPlayCount = counters!.audioPlayCount;
      if ((counters?.audioPageView ?? 0) > existing.audioPageView)
        existing.audioPageView = counters!.audioPageView;
      if ((counters?.downloads ?? 0) > existing.downloads)
        existing.downloads = counters!.downloads;
      if ((counters?.enSummaryView ?? 0) > existing.enSummaryView)
        existing.enSummaryView = counters!.enSummaryView;
      if ((counters?.ruSummaryView ?? 0) > existing.ruSummaryView)
        existing.ruSummaryView = counters!.ruSummaryView;
      if ((counters?.enTranscriptionView ?? 0) > existing.enTranscriptionView)
        existing.enTranscriptionView = counters!.enTranscriptionView;
      if ((counters?.ruTranscriptionView ?? 0) > existing.ruTranscriptionView)
        existing.ruTranscriptionView = counters!.ruTranscriptionView;
      if ((counters?.videoPageView ?? 0) > existing.videoPageView)
        existing.videoPageView = counters!.videoPageView;
    } else {
      const emails = new Set<string>();
      emails.add(entry.email);
      map.set(id, {
        id,
        title: parseLectureTitle(entry.contentTitle),
        url: entry.url,
        audioPlayCount: counters?.audioPlayCount ?? 0,
        audioPageView: counters?.audioPageView ?? 0,
        downloads: counters?.downloads ?? 0,
        enSummaryView: counters?.enSummaryView ?? 0,
        ruSummaryView: counters?.ruSummaryView ?? 0,
        enTranscriptionView: counters?.enTranscriptionView ?? 0,
        ruTranscriptionView: counters?.ruTranscriptionView ?? 0,
        videoPageView: counters?.videoPageView ?? 0,
        createdDateTime: entry.contentData?.createdDateTime ?? entry.contentDate,
        uniqueListeners: 1,
        totalPlays: 1,
        lastPlayed: entry.timestamp,
        _emails: emails,
      });
    }
  }

  // Strip internal _emails set before returning
  return Array.from(map.values())
    .map(({ _emails, ...rest }) => rest)
    .sort((a, b) => new Date(b.createdDateTime).getTime() - new Date(a.createdDateTime).getTime());
}

function aggregateBlogs(entries: BlogPostEntry[]): AggregatedBlog[] {
  const map = new Map<string, AggregatedBlog & { _emails: Set<string> }>();

  for (const entry of entries) {
    // Skip entries without a proper blog content ID (e.g. blog listing page views)
    const id = entry.contentData?._id;
    if (!id) continue;

    // Skip entries with generic URLs like "/blog" (listing page, not an individual blog)
    if (entry.url === "/blog" || entry.url === "/blog/") continue;

    const existing = map.get(id);

    const title =
      entry.contentData?.en?.title ||
      entry.contentData?.cyr?.title ||
      parseLectureTitle(entry.contentTitle);

    const pageView = entry.contentData?.counters?.blogPageView ?? 0;

    if (existing) {
      // Always add to viewers list (for display)
      existing.recentViewers.push({
        email: entry.email,
        name: entry.legalName,
        spiritualName: entry.spiritualName,
        displayPicture: entry.displayPicture,
        timestamp: entry.timestamp,
        disciple: entry.disciple,
      });
      // Track unique by email
      existing._emails.add(entry.email);
      existing.uniqueViewers = existing._emails.size;
      // Use the highest blogPageView counter value (real-time counters can differ between entries)
      if (pageView > existing.blogPageView) {
        existing.blogPageView = pageView;
      }
    } else {
      const emails = new Set<string>();
      emails.add(entry.email);
      // Use the specific blog URL from the entry, or construct from ID
      const blogUrl = entry.url && entry.url !== "/blog" ? entry.url : `/blog/${id}`;
      map.set(id, {
        id,
        url: blogUrl,
        title,
        blogPageView: pageView,
        blogDate: entry.contentData?.blogDate || entry.contentDate,
        uniqueViewers: 1,
        _emails: emails,
        recentViewers: [
          {
            email: entry.email,
            name: entry.legalName,
            spiritualName: entry.spiritualName,
            displayPicture: entry.displayPicture,
            timestamp: entry.timestamp,
            disciple: entry.disciple,
          },
        ],
      });
    }
  }

  return Array.from(map.values())
    .map(({ _emails, ...rest }) => rest)
    .sort((a, b) => new Date(b.blogDate).getTime() - new Date(a.blogDate).getTime());
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-[400px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>
  );
}

export function Dashboard() {
  // Detail drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"lecture" | "blog">("lecture");
  const [selectedLecture, setSelectedLecture] =
    useState<AggregatedLecture | null>(null);
  const [selectedBlogUrl, setSelectedBlogUrl] = useState<string>("");
  const [selectedBlogTitle, setSelectedBlogTitle] = useState<string>("");

  // Fetch ALL lecture entries across all pages
  const {
    data: lectureAllData,
    isLoading: lecturesLoading,
    mutate: mutateLectures,
  } = useSWR<{ data: LectureEntry[]; totalPages: number }>(
    "/api/insights/all?resource=lecture&sort=timestamp&field=url",
    fetcher,
    { refreshInterval: 120000 }
  );

  // Fetch ALL blogpost entries across all pages
  const {
    data: blogAllData,
    isLoading: blogsLoading,
    mutate: mutateBlogs,
  } = useSWR<{ data: BlogPostEntry[]; totalPages: number }>(
    "/api/insights/all?resource=blogpost&sort=timestamp&field=url",
    fetcher,
    { refreshInterval: 120000 }
  );

  const isLoading = lecturesLoading || blogsLoading;

  const allLectures = lectureAllData?.data ?? [];
  const allBlogPosts = blogAllData?.data ?? [];

  const aggregatedLectures = aggregateLectures(allLectures);
  const aggregatedBlogs = aggregateBlogs(allBlogPosts);

  // Compute KPIs
  const totalPlays = aggregatedLectures.reduce(
    (sum, l) => sum + l.audioPlayCount,
    0
  );
  const totalPageViews = aggregatedLectures.reduce(
    (sum, l) => sum + l.audioPageView,
    0
  );
  const totalDownloads = aggregatedLectures.reduce(
    (sum, l) => sum + l.downloads,
    0
  );
  const totalBlogViews = aggregatedBlogs.reduce(
    (sum, b) => sum + b.blogPageView,
    0
  );
  const uniqueLectureListeners = new Set(
    allLectures.map((l) => l.email)
  ).size;

  const handleRefresh = () => {
    mutateLectures();
    mutateBlogs();
  };

  const handleLectureSelect = (lecture: AggregatedLecture) => {
    setSelectedLecture(lecture);
    setDrawerType("lecture");
    setDrawerOpen(true);
  };

  const handleBlogSelect = (blogUrl: string, blogTitle: string) => {
    setSelectedBlogUrl(blogUrl);
    setSelectedBlogTitle(blogTitle);
    setDrawerType("blog");
    setDrawerOpen(true);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total Audio Plays"
          value={totalPlays}
          icon={<Play className="size-5" />}
        />
        <StatCard
          label="Total Page Views"
          value={totalPageViews}
          icon={<Eye className="size-5" />}
        />
        <StatCard
          label="Total Downloads"
          value={totalDownloads}
          icon={<Download className="size-5" />}
        />
        <StatCard
          label="Lecture Listeners"
          value={uniqueLectureListeners}
          icon={<Headphones className="size-5" />}
        />
        <StatCard
          label="Blog Page Views"
          value={totalBlogViews}
          icon={<FileText className="size-5" />}
        />
      </div>

      {/* Main Content: Table */}
      <div className="grid grid-cols-1 gap-6">
        {/* Content Tables */}
        <div>
          <Tabs defaultValue="blogs">
            <Card className="gap-0 py-0">
              <CardHeader className="flex-row items-center justify-between pb-0 pt-4">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Content Performance
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/70">
                    Click any row for detailed breakdown
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <TabsList className="bg-orange-100 dark:bg-orange-950/40">
                    <TabsTrigger
                      value="blogs"
                      className="gap-1.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:bg-orange-500 dark:data-[state=active]:text-white"
                    >
                      <FileText className="size-3.5" />
                      Blogs
                    </TabsTrigger>
                    <TabsTrigger
                      value="lectures"
                      className="gap-1.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:bg-orange-500 dark:data-[state=active]:text-white"
                    >
                      <Headphones className="size-3.5" />
                      Lectures
                    </TabsTrigger>
                    <TabsTrigger
                      value="users"
                      className="gap-1.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:bg-orange-500 dark:data-[state=active]:text-white"
                    >
                      <Users className="size-3.5" />
                      Users
                    </TabsTrigger>
                    <TabsTrigger
                      value="activity"
                      className="gap-1.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:bg-orange-500 dark:data-[state=active]:text-white"
                    >
                      <Activity className="size-3.5" />
                      Activity
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-card-foreground"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="size-3.5" />
                    <span className="sr-only">Refresh data</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2 pt-4">
                <TabsContent value="blogs" className="mt-0">
                  <BlogsTable
                    blogs={aggregatedBlogs}
                    onSelect={handleBlogSelect}
                  />
                </TabsContent>
                <TabsContent value="lectures" className="mt-0">
                  <LecturesTable
                    lectures={aggregatedLectures}
                    onSelect={handleLectureSelect}
                  />
                </TabsContent>
                <TabsContent value="users" className="mt-0">
                  <UserActivityTable />
                </TabsContent>
                <TabsContent value="activity" className="mt-0">
                  <div className="max-h-[400px] overflow-y-auto">
                    <ActivityFeed lectures={allLectures} blogPosts={allBlogPosts} />
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>

      {/* Detail Drawer */}
      <ContentDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        type={drawerType}
        lecture={selectedLecture ?? undefined}
        blogUrl={selectedBlogUrl}
        blogTitle={selectedBlogTitle}
      />
    </div>
  );
}
