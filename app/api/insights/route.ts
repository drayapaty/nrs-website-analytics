import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://backend.niranjanaswami.net/api/insights/agglist";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = searchParams.get("page") || "1";
  const field = searchParams.get("field") || "url";
  const resource = searchParams.get("resource") || "lecture";
  const sort = searchParams.get("sort") || "timestamp";

  const url = `${BASE_URL}?page=${page}&field=${field}&resource=${resource}&sort=${sort}`;

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from backend" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}
