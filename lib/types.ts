export interface LectureCounters {
  ruSummaryView: number;
  enSummaryView: number;
  downloads: number;
  audioPageView: number;
  audioPlayCount: number;
  enTranscriptionView: number;
  videoPageView: number;
  ruTranscriptionView: number;
}

export interface LectureContentData {
  counters: LectureCounters;
  createdDateTime: string;
  en: {
    title: string;
    summary: Record<string, unknown>;
    transcription: Record<string, unknown>;
  };
  cyr?: {
    title: string;
    summary: Record<string, unknown>;
    transcription: Record<string, unknown>;
  };
  _index: string;
  _id: string;
  publishedDate: string | null;
}

export interface LectureEntry {
  displayPicture: string;
  disciple: number;
  legalName: string;
  contentDate: string;
  resource: "lecture";
  action: "play";
  contentTitle: string;
  url: string;
  email: string;
  spiritualName: string;
  timestamp: number;
  contentData: LectureContentData;
}

// Blogpost entry from resource=blogpost (aggregated list)
export interface BlogPostEntry {
  displayPicture: string;
  disciple: number;
  legalName: string;
  contentDate: string;
  resource: "blogpost";
  action: "view";
  contentTitle: string; // JSON string: {"en":"...","ru":"..."}
  url: string;
  email: string;
  spiritualName: string;
  timestamp: number;
  contentData: {
    counters: {
      blogPageView: number;
    };
    blogDate: string;
    en: { title: string };
    cyr?: { title: string };
    _index: string;
    _id: string;
    publishDate: string | null;
    createdDateTime: string | null;
  };
}

// Legacy blog entry (kept for compatibility)
export interface BlogEntry {
  legalName: string;
  disciple: string;
  resource: "blog";
  action: "view";
  url: string;
  email: string;
  spiritualName: string;
  timestamp: number;
}

// User activity entry from agglist (no resource/field filters)
export interface UserActivityEntry {
  displayPicture: string;
  disciple: number | string;
  legalName: string;
  contentDate?: string;
  resource: string;
  action: string;
  contentTitle?: string;
  url: string;
  email: string;
  spiritualName: string;
  timestamp: number;
}

// Aggregated user for the User Activity tab
export interface AggregatedUser {
  email: string;
  legalName: string;
  spiritualName: string;
  displayPicture: string;
  disciple: number;
  totalEvents: number;
  lastActive: number;
  resourceCounts: Record<string, number>;
  actionCounts: Record<string, number>;
  recentActivity: {
    resource: string;
    action: string;
    url: string;
    title: string;
    timestamp: number;
  }[];
}

export interface ApiResponse<T> {
  data: T[];
}

export interface AggregatedLecture {
  id: string;
  title: string;
  url: string;
  audioPlayCount: number;
  audioPageView: number;
  downloads: number;
  enSummaryView: number;
  ruSummaryView: number;
  enTranscriptionView: number;
  ruTranscriptionView: number;
  videoPageView: number;
  createdDateTime: string;
  uniqueListeners: number;
  totalPlays: number;
  lastPlayed: number;
}

export interface AggregatedBlog {
  id: string;
  url: string;
  title: string;
  blogPageView: number;
  blogDate: string;
  uniqueViewers: number;
  recentViewers: {
    email: string;
    name: string;
    spiritualName: string;
    displayPicture: string;
    timestamp: number;
    disciple: number;
  }[];
}
