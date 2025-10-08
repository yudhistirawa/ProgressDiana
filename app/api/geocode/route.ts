export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  if (!lat || !lon) {
    return new Response(
      JSON.stringify({ error: "lat and lon are required" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "proyek-survei/1.0 (BGD Sistem Dokumentasi)",
        "Accept-Language": "id-ID, id; q=0.9, en; q=0.8",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream error ${res.status}` }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }
    const data = await res.json();
    const display =
      data?.name ||
      data?.display_name ||
      [
        data?.address?.road,
        data?.address?.suburb || data?.address?.neighbourhood,
        data?.address?.city || data?.address?.town || data?.address?.village,
        data?.address?.state,
        data?.address?.postcode,
        data?.address?.country,
      ]
        .filter(Boolean)
        .join(", ");

    return new Response(
      JSON.stringify({
        label: display,
        raw: data,
      }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

