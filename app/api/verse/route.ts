import { isBibleVersion, lookupVerse } from "@/lib/bible";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") ?? "";
  const version = url.searchParams.get("version") ?? "KJV";
  const result = await lookupVerse(reference, isBibleVersion(version) ? version : "");

  if ("error" in result) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}
