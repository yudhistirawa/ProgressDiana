import { NextRequest, NextResponse } from "next/server";

// Simple server-side proxy to download an image (helps avoid browser CORS issues during export)
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const buildDownloadUrl = (input: string) => {
    if (!input.includes("alt=media")) {
      return input.includes("?") ? `${input}&alt=media` : `${input}?alt=media`;
    }
    return input;
  };

  const tryFetch = async (target: string) => {
    const res = await fetch(target, {
      cache: "no-store",
      // avoid sending cookies/headers; we only need public download URLs
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return null;
    const buffer = await res.arrayBuffer();
    const ext = ct.includes("png") ? "png" : "jpeg";
    return { buffer, ext: ext === "jpg" ? "jpeg" : ext };
  };

  try {
    const primary = buildDownloadUrl(url.trim());
    const first = await tryFetch(primary);
    if (first) {
      const base64 = Buffer.from(first.buffer).toString("base64");
      return NextResponse.json({
        base64: `data:image/${first.ext};base64,${base64}`,
        ext: first.ext,
      });
    }
    if (primary !== url.trim()) {
      const second = await tryFetch(url.trim());
      if (second) {
        const base64 = Buffer.from(second.buffer).toString("base64");
        return NextResponse.json({
          base64: `data:image/${second.ext};base64,${base64}`,
          ext: second.ext,
        });
      }
    }
    return NextResponse.json({ error: "fetch_failed" }, { status: 422 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "failed" }, { status: 500 });
  }
}
