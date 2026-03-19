import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://backend.niranjanaswami.net/api/insights/agglist";
const BLOG_DETAIL_URL = "https://backend.niranjanaswami.net/api/blog";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const field = searchParams.get("field") || "url";
  const resource = searchParams.get("resource") ?? "";
  const sort = searchParams.get("sort") || "timestamp";

  const allData: Record<string, unknown>[] = [];
  let page = 1;
  const maxPages = 25; // Safety cap

  try {
    // Step 1: Fetch all pages of agglist data
    while (page <= maxPages) {
      const params = new URLSearchParams({ page: String(page) });
      if (field) params.set("field", field);
      if (resource) params.set("resource", resource);
      if (sort) params.set("sort", sort);
      const url = `${BASE_URL}?${params.toString()}`;
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 120 },
      });

      if (!res.ok) break;

      const json = await res.json();
      const entries = json.data;

      if (!entries || entries.length === 0) break;

      allData.push(...entries);
      page++;
    }

    // Step 2: For blogpost resources, filter to only published blogs
    if (resource === "blogpost") {
      // Collect unique blog IDs
      const uniqueBlogIds = new Set<string>();
      for (const entry of allData) {
        const contentData = entry.contentData as Record<string, unknown> | undefined;
        const id = contentData?._id as string | undefined;
        if (id) uniqueBlogIds.add(id);
      }

      // Fetch status for each unique blog in parallel (batched)
      const blogStatuses = new Map<string, string>();
      const blogIds = Array.from(uniqueBlogIds);
      const batchSize = 10;

      for (let i = 0; i < blogIds.length; i += batchSize) {
        const batch = blogIds.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (id) => {
            const res = await fetch(`${BLOG_DETAIL_URL}/${id}`, {
              next: { revalidate: 300 },
            });
            if (!res.ok) return { id, status: "unknown" };
            const json = await res.json();
            return { id, status: json.data?.status || "unknown" };
          })
        );

        for (const result of results) {
          if (result.status === "fulfilled") {
            const { id, status } = result.value;
            blogStatuses.set(id, status);
          }
        }
      }

      // Filter out non-published blogs
      const publishedData = allData.filter((entry) => {
        const contentData = entry.contentData as Record<string, unknown> | undefined;
        const id = contentData?._id as string | undefined;
        if (!id) return false;
        const status = blogStatuses.get(id);
        return status === "published";
      });

      return NextResponse.json({
        data: publishedData,
        totalPages: page - 1,
        totalEntries: publishedData.length,
        filteredOut: allData.length - publishedData.length,
      });
    }

    return NextResponse.json({ data: allData, totalPages: page - 1 });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}
