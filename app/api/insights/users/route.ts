import { NextResponse } from "next/server";

const BASE_URL = "https://backend.niranjanaswami.net/api/insights/agglist";

export async function GET() {
  const allData: Record<string, unknown>[] = [];
  let page = 1;
  const maxPages = 25;

  try {
    while (page <= maxPages) {
      const url = `${BASE_URL}?page=${page}`;
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

    return NextResponse.json({ data: allData, totalPages: page - 1 });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}
