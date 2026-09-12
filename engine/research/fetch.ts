/**
 * Metadata retrieval for `cite add`.
 *
 * The rule this enforces: bibliographic details are *looked up*, never typed
 * from memory. A DOI goes to Crossref, an arXiv id to arXiv, a bare URL to the
 * page's own metadata. What comes back is written into a source record for a
 * human to check — the engine fills in the record, it does not vouch for it.
 */

import type { SourceType } from "./source.ts";

export interface FetchedMetadata {
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  isbn?: string;
  url?: string;
  type: SourceType;
  /** Where this record came from, for the audit trail. */
  retrievedFrom: string;
}

const UA = "code-as-color-research-engine/0.1 (book build tooling)";

/** Crossref and page titles arrive HTML-escaped often enough to matter. */
const decodeEntities = (s: string): string =>
  s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)));

/**
 * Crossref titles arrive with publisher markup in them surprisingly often:
 * JATS `<title>` wrappers, `<i>` runs, and trailing footnote daggers.
 */
const cleanTitle = (s: string): string =>
  decodeEntities(s)
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .replace(/[*\u2020\u2021]+\s*$/, "")
    .trim();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * One HTTP attempt, with a hard timeout.
 *
 * Metadata services rate-limit and time out; a lookup that gives up on the
 * first refusal makes the tool feel broken when it is merely being throttled.
 */
const once = async (url: string, ms: number, headers: Record<string, string>): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal, headers: { "user-agent": UA, ...headers } });
  } finally {
    clearTimeout(timer);
  }
};

const withTimeout = async (
  url: string,
  ms = 20_000,
  headers: Record<string, string> = {},
  attempts = 3,
): Promise<Response> => {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(800 * 2 ** (i - 1));
    try {
      const res = await once(url, ms, headers);
      // 429 and 5xx are worth another go; 404 is not.
      if (res.status === 429 || res.status >= 500) { last = new Error(`HTTP ${res.status}`); continue; }
      return res;
    } catch (err) {
      last = err;
    }
  }
  const cause = last instanceof Error ? ((last as Error & { cause?: { code?: string } }).cause?.code ?? last.message) : String(last);
  throw new Error(`could not reach ${new URL(url).host} after ${attempts} attempts (${cause})`);
};

const CROSSREF_TYPE: Record<string, SourceType> = {
  "journal-article": "article",
  "proceedings-article": "article",
  "book": "book",
  "book-chapter": "book",
  "monograph": "book",
  "report": "report",
  "standard": "standard",
  "dissertation": "thesis",
  "dataset": "dataset",
};

export async function lookupDoi(doi: string): Promise<FetchedMetadata> {
  const clean = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
  const endpoint = `https://api.crossref.org/works/${encodeURIComponent(clean)}`;
  const res = await withTimeout(endpoint);
  if (!res.ok) throw new Error(`Crossref returned ${res.status} for DOI ${clean}`);
  const json = (await res.json()) as { message: Record<string, unknown> };
  const m = json.message;

  const titleArr = m["title"] as string[] | undefined;
  const authors = ((m["author"] as Array<{ given?: string; family?: string; name?: string }>) ?? [])
    .map((a) => (a.family ? `${a.family}, ${a.given ?? ""}`.trim().replace(/,$/, "") : a.name ?? ""))
    .filter(Boolean);
  const issued = m["issued"] as { "date-parts"?: number[][] } | undefined;
  const year = issued?.["date-parts"]?.[0]?.[0];
  const container = (m["container-title"] as string[] | undefined)?.[0];
  const type = CROSSREF_TYPE[String(m["type"])] ?? "article";

  return {
    title: cleanTitle(titleArr?.[0] ?? clean),
    authors,
    year,
    journal: type === "article" && container ? decodeEntities(container) : undefined,
    publisher: type === "article"
      ? undefined
      : decodeEntities((m["publisher"] as string | undefined) ?? container ?? "") || undefined,
    volume: m["volume"] as string | undefined,
    issue: m["issue"] as string | undefined,
    pages: m["page"] as string | undefined,
    doi: (m["DOI"] as string | undefined) ?? clean,
    isbn: (m["ISBN"] as string[] | undefined)?.[0],
    url: `https://doi.org/${clean}`,
    type,
    retrievedFrom: endpoint,
  };
}

export async function lookupArxiv(id: string): Promise<FetchedMetadata> {
  const clean = id.replace(/^arxiv:/i, "").trim();
  const endpoint = `http://export.arxiv.org/api/query?id_list=${encodeURIComponent(clean)}`;
  const res = await withTimeout(endpoint);
  if (!res.ok) throw new Error(`arXiv returned ${res.status} for ${clean}`);
  const xml = await res.text();
  const pick = (tag: string): string | undefined =>
    new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(xml)?.[1]?.replace(/\s+/g, " ").trim();
  const authors = [...xml.matchAll(/<name>([\s\S]*?)<\/name>/g)].map((m) => m[1]!.trim());
  const published = pick("published");

  return {
    title: cleanTitle(pick("title") ?? clean),
    authors,
    year: published ? Number(published.slice(0, 4)) : undefined,
    journal: "arXiv preprint",
    url: `https://arxiv.org/abs/${clean}`,
    type: "article",
    retrievedFrom: endpoint,
  };
}

const metaTag = (html: string, name: string): string | undefined => {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"),
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const p of patterns) {
    const m = p.exec(html);
    if (m) return m[1]!.replace(/\s+/g, " ").trim();
  }
  return undefined;
};

const allMetaTags = (html: string, name: string): string[] =>
  [...html.matchAll(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "gi"))]
    .map((m) => m[1]!.trim());

/** Best-effort metadata from a web page: Highwire tags, then Open Graph, then <title>. */
export async function lookupUrl(url: string): Promise<FetchedMetadata> {
  const res = await withTimeout(url, 20_000, { accept: "text/html,*/*" });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  const html = (await res.text()).slice(0, 500_000);

  const title = cleanTitle(
    metaTag(html, "citation_title") ?? metaTag(html, "og:title") ??
    /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? url,
  );
  const authors = allMetaTags(html, "citation_author");
  const dateStr = metaTag(html, "citation_publication_date") ?? metaTag(html, "article:published_time");
  const doi = metaTag(html, "citation_doi");

  if (doi) {
    try { return { ...(await lookupDoi(doi)), url }; } catch { /* fall through to page metadata */ }
  }

  return {
    title,
    authors: authors.length ? authors : (metaTag(html, "author") ? [metaTag(html, "author")!] : []),
    year: dateStr ? Number(dateStr.slice(0, 4)) : undefined,
    publisher: metaTag(html, "og:site_name"),
    doi,
    url,
    type: "web",
    retrievedFrom: url,
  };
}

/** Dispatch on what the identifier looks like. */
export async function lookup(identifier: string): Promise<FetchedMetadata> {
  const id = identifier.trim();
  if (/^10\.\d{4,9}\//.test(id) || /doi\.org\//i.test(id)) return lookupDoi(id);
  if (/^arxiv:/i.test(id) || /^\d{4}\.\d{4,5}(v\d+)?$/.test(id)) return lookupArxiv(id);
  if (/^https?:\/\//i.test(id)) return lookupUrl(id);
  throw new Error(`cannot tell what "${id}" is — pass a DOI, an arXiv id, or a URL`);
}

/** Search Crossref by title when you do not have an identifier. */
export async function searchCrossref(query: string, rows = 5): Promise<Array<{ doi: string; title: string; year?: number; authors: string }>> {
  const endpoint = `https://api.crossref.org/works?rows=${rows}&select=DOI,title,author,issued&query.bibliographic=${encodeURIComponent(query)}`;
  const res = await withTimeout(endpoint);
  if (!res.ok) throw new Error(`Crossref search returned ${res.status}`);
  const json = (await res.json()) as { message: { items: Array<Record<string, unknown>> } };
  return json.message.items.map((m) => ({
    doi: String(m["DOI"]),
    title: cleanTitle((m["title"] as string[] | undefined)?.[0] ?? "(untitled)"),
    year: ((m["issued"] as { "date-parts"?: number[][] } | undefined)?.["date-parts"]?.[0]?.[0]),
    authors: ((m["author"] as Array<{ family?: string }> | undefined) ?? [])
      .map((a) => a.family).filter(Boolean).slice(0, 3).join(", "),
  }));
}

/** Derive a citation key of the form `firstauthor-year-word`. */
export function suggestKey(meta: FetchedMetadata): string {
  const family = meta.authors[0]?.split(",")[0] ?? meta.publisher ?? "anon";
  const word = meta.title.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
    .filter((w) => w.length > 3 && !["with", "from", "that", "this", "their", "using", "based"].includes(w))[0] ?? "source";
  return [family, meta.year, word]
    .filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
