import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://backend.niranjanaswami.net";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const url = searchParams.get("url");
  const email = searchParams.get("email");
  const action = searchParams.get("action");

  if (!url && !email) {
    return NextResponse.json({ error: "url or email is required" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams();
    if (url) params.set("url", url);
    if (email) params.set("email", email);
    if (action) params.set("action", action);

    const apiUrl = `${BACKEND}/api/insights/list?${params.toString()}`;
    const res = await fetch(apiUrl, { next: { revalidate: 60 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch detail data" },
      { status: 500 }
    );
  }
}
