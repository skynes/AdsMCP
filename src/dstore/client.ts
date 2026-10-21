import { loadEnv } from "../env.js";

export interface DstoreCard {
  id: number;
  title: string;
  subtitle?: string;
  url?: string;
  icon?: string;
  platform?: string;
  tags: string[];
  description?: string;
  useCase?: string;
  languages: string[];
  ageRating?: string;
  developer?: { name?: string };
  inAppPurchases: boolean;
  advertising?: DstoreAdvertising;
  communitySource?: DstoreCommunitySource;
  source: "dstore";
  sourceUrl: string;
}

export interface DstoreCommunitySource {
  provider: string;
  topicUrl?: string;
  replyId?: string;
  author?: string;
  observedAt?: string;
  checkedAt?: string;
  verification: "pending" | "verified" | "observed" | "unverified" | string;
}

export interface DstoreAdvertisingSource {
  url: string;
  type?: string;
  authority?: "official" | "third_party" | "unverified" | string;
  priority?: number;
  foundAt?: string;
  checkedAt?: string;
}

export interface DstoreAdvertisingPlacement {
  id: string;
  format: string;
  pricingModel?: string;
  price?: number;
  currency?: string;
  unit?: string;
  availability?: string;
  minOrder?: number;
  leadTimeHours?: number;
  sourceUrl?: string;
  sourceText?: string;
}

export interface DstoreAdvertising {
  schemaVersion?: string;
  status: "available" | "observed" | "unverified" | string;
  source: DstoreAdvertisingSource;
  sources?: DstoreAdvertisingSource[];
  placements: DstoreAdvertisingPlacement[];
  contact?: { url?: string; username?: string; email?: string };
  rules?: string;
  updatedAt?: string;
}

export interface DstoreCardBatchResult {
  cards: DstoreCard[];
  errors: Array<{ ref: string; error: string }>;
}

export interface DstorePlacement {
  id: number;
  resourceUrl: string;
  title: string;
  description?: string;
  icon?: string;
  platform?: string;
  categories: string[];
  languages: string[];
  placements: DstoreAdvertisingPlacement[];
  source: DstoreAdvertisingSource;
  sources?: DstoreAdvertisingSource[];
  verification?: { status?: string; method?: string; checkedAt?: string };
  pageUrl: string;
}

export interface DstorePlacementSearchArgs {
  q?: string;
  platform?: string;
  lang?: string;
  region?: string;
  category?: string;
  format?: string;
  pricingModel?: string;
  currency?: string;
  sort?: "updated" | "relevance" | "title";
  limit?: number;
  cursor?: string;
}

export interface DstorePlacementSearchResult {
  schemaVersion?: string;
  generatedAt?: string;
  revision?: string;
  items: DstorePlacement[];
  nextCursor?: string;
}

type JsonObject = Record<string, unknown>;

export function dstoreBaseUrl(): string {
  loadEnv();
  return (process.env.ADS_DSTORE_BASE_URL?.trim() || "https://dstore.one").replace(/\/$/, "");
}

export function dstoreCatalogBaseUrl(): string {
  loadEnv();
  return (process.env.ADS_DSTORE_CATALOG_URL?.trim() || "https://db.dstore.one").replace(/\/$/, "");
}

export function dstoreTimeoutMs(): number {
  loadEnv();
  const value = Number(process.env.ADS_DSTORE_TIMEOUT_MS || 10_000);
  return Number.isFinite(value) && value >= 1_000 && value <= 60_000 ? value : 10_000;
}

export function dstoreCardUrl(id: number): string {
  return `${dstoreBaseUrl()}/${id}`;
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(input: JsonObject, key: string): string | undefined {
  const value = input[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringArrayField(input: JsonObject, key: string): string[] {
  const value = input[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [];
}

function numberField(input: JsonObject, key: string): number | undefined {
  const value = input[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeDstoreAdvertisingSource(value: unknown): DstoreAdvertisingSource | undefined {
  if (!isObject(value)) return undefined;
  const url = stringField(value, "url");
  if (!url) return undefined;
  return {
    url,
    ...(stringField(value, "type") ? { type: stringField(value, "type") } : {}),
    ...(stringField(value, "authority") ? { authority: stringField(value, "authority") } : {}),
    ...(numberField(value, "priority") != null ? { priority: numberField(value, "priority") } : {}),
    ...(stringField(value, "foundAt") ? { foundAt: stringField(value, "foundAt") } : {}),
    ...(stringField(value, "checkedAt") ? { checkedAt: stringField(value, "checkedAt") } : {}),
  };
}

function normalizeAdvertisingPlacements(value: unknown): DstoreAdvertisingPlacement[] {
  return Array.isArray(value)
    ? value.filter(isObject).map((placement, index) => {
      const id = stringField(placement, "id") || `placement-${index + 1}`;
      const format = stringField(placement, "format") || "advertising";
      return {
        id,
        format,
        ...(stringField(placement, "pricingModel") ? { pricingModel: stringField(placement, "pricingModel") } : {}),
        ...(numberField(placement, "price") != null ? { price: numberField(placement, "price") } : {}),
        ...(stringField(placement, "currency") ? { currency: stringField(placement, "currency") } : {}),
        ...(stringField(placement, "unit") ? { unit: stringField(placement, "unit") } : {}),
        ...(stringField(placement, "availability") ? { availability: stringField(placement, "availability") } : {}),
        ...(numberField(placement, "minOrder") != null ? { minOrder: numberField(placement, "minOrder") } : {}),
        ...(numberField(placement, "leadTimeHours") != null ? { leadTimeHours: numberField(placement, "leadTimeHours") } : {}),
        ...(stringField(placement, "sourceUrl") ? { sourceUrl: stringField(placement, "sourceUrl") } : {}),
        ...(stringField(placement, "sourceText") ? { sourceText: stringField(placement, "sourceText") } : {}),
      };
    })
    : [];
}

function advertisingField(input: JsonObject): DstoreAdvertising | undefined {
  const raw = input.advertising;
  if (!isObject(raw)) return undefined;
  const source = normalizeDstoreAdvertisingSource(raw.source);
  const placements = normalizeAdvertisingPlacements(raw.placements);
  if (!source || !placements.length) return undefined;
  const contact = isObject(raw.contact)
    ? {
      ...(stringField(raw.contact, "url") ? { url: stringField(raw.contact, "url") } : {}),
      ...(stringField(raw.contact, "username") ? { username: stringField(raw.contact, "username") } : {}),
      ...(stringField(raw.contact, "email") ? { email: stringField(raw.contact, "email") } : {}),
    }
    : undefined;
  const sources = Array.isArray(raw.sources)
    ? raw.sources.map(normalizeDstoreAdvertisingSource).filter((item): item is DstoreAdvertisingSource => Boolean(item))
    : undefined;
  return {
    schemaVersion: stringField(raw, "schemaVersion"),
    status: stringField(raw, "status") || "observed",
    source,
    ...(sources?.length ? { sources } : {}),
    placements,
    ...(contact && Object.keys(contact).length ? { contact } : {}),
    ...(stringField(raw, "rules") ? { rules: stringField(raw, "rules") } : {}),
    ...(stringField(raw, "updatedAt") ? { updatedAt: stringField(raw, "updatedAt") } : {}),
  };
}

function normalizeDstorePlacement(payload: unknown): DstorePlacement | undefined {
  if (!isObject(payload)) return undefined;
  const id = typeof payload.id === "number" && Number.isInteger(payload.id) ? payload.id : undefined;
  const title = stringField(payload, "title");
  const resourceUrl = stringField(payload, "resourceUrl") || stringField(payload, "url");
  const source = normalizeDstoreAdvertisingSource(payload.source)
    || (isObject(payload.advertising) ? normalizeDstoreAdvertisingSource(payload.advertising.source) : undefined);
  const placements = normalizeAdvertisingPlacements(payload.placements)
    .concat(isObject(payload.advertising) ? normalizeAdvertisingPlacements(payload.advertising.placements) : []);
  if (!id || !title || !resourceUrl || !source || !placements.length) return undefined;
  const verification = isObject(payload.verification)
    ? {
      ...(stringField(payload.verification, "status") ? { status: stringField(payload.verification, "status") } : {}),
      ...(stringField(payload.verification, "method") ? { method: stringField(payload.verification, "method") } : {}),
      ...(stringField(payload.verification, "checkedAt") ? { checkedAt: stringField(payload.verification, "checkedAt") } : {}),
    }
    : undefined;
  const sources = Array.isArray(payload.sources)
    ? payload.sources.map(normalizeDstoreAdvertisingSource).filter((item): item is DstoreAdvertisingSource => Boolean(item))
    : undefined;
  return {
    id,
    resourceUrl,
    title,
    ...(stringField(payload, "description") ? { description: stringField(payload, "description") } : {}),
    ...(stringField(payload, "icon") ? { icon: stringField(payload, "icon") } : {}),
    ...(stringField(payload, "platform") ? { platform: stringField(payload, "platform") } : {}),
    categories: stringArrayField(payload, "categories"),
    languages: stringArrayField(payload, "languages").concat(stringArrayField(payload, "lang")),
    placements,
    source,
    ...(sources?.length ? { sources } : {}),
    ...(verification && Object.keys(verification).length ? { verification } : {}),
    pageUrl: stringField(payload, "pageUrl") || dstoreCardUrl(id),
  };
}

function communitySourceField(input: JsonObject): DstoreCommunitySource | undefined {
  const raw = isObject(input.communitySource)
    ? input.communitySource
    : isObject(input.community_source)
      ? input.community_source
      : undefined;
  if (!raw) return undefined;
  const provider = stringField(raw, "provider");
  const verification = stringField(raw, "verification");
  if (!provider || !verification) return undefined;
  return {
    provider,
    verification,
    ...(stringField(raw, "topicUrl") || stringField(raw, "topic_url")
      ? { topicUrl: stringField(raw, "topicUrl") || stringField(raw, "topic_url") }
      : {}),
    ...(stringField(raw, "replyId") || stringField(raw, "reply_id")
      ? { replyId: stringField(raw, "replyId") || stringField(raw, "reply_id") }
      : {}),
    ...(stringField(raw, "author") ? { author: stringField(raw, "author") } : {}),
    ...(stringField(raw, "observedAt") || stringField(raw, "observed_at")
      ? { observedAt: stringField(raw, "observedAt") || stringField(raw, "observed_at") }
      : {}),
    ...(stringField(raw, "checkedAt") || stringField(raw, "checked_at")
      ? { checkedAt: stringField(raw, "checkedAt") || stringField(raw, "checked_at") }
      : {}),
  };
}

export function parseDstoreCardId(ref: string | number): number {
  const value = String(ref).trim();
  if (/^\d+$/.test(value)) return Number(value);
  try {
    const url = new URL(value);
    if (url.hostname !== new URL(dstoreBaseUrl()).hostname) throw new Error("not a dStore URL");
    const match = url.pathname.match(/^\/(\d+)(?:\.json)?\/?$/);
    if (match) return Number(match[1]);
  } catch {
    // The caller receives the stable validation error below.
  }
  throw new Error(`Invalid dStore card reference: ${value}. Use a numeric card id or https://dstore.one/{id}.`);
}

export function normalizeDstoreCard(payload: unknown, idHint?: number): DstoreCard {
  if (!isObject(payload)) throw new Error("dStore returned a non-object card payload");
  const id = typeof payload.id === "number" && Number.isInteger(payload.id) ? payload.id : idHint;
  const title = stringField(payload, "title");
  if (!id || id < 1 || !title) throw new Error("dStore card payload is missing id or title");
  const developer = isObject(payload.developer) ? { name: stringField(payload.developer, "name") } : undefined;
  const advertising = advertisingField(payload);
  const communitySource = communitySourceField(payload);
  return {
    id,
    title,
    ...(stringField(payload, "subtitle") ? { subtitle: stringField(payload, "subtitle") } : {}),
    ...(stringField(payload, "url") ? { url: stringField(payload, "url") } : {}),
    ...(stringField(payload, "icon") ? { icon: stringField(payload, "icon") } : {}),
    ...(stringField(payload, "platform") ? { platform: stringField(payload, "platform") } : {}),
    tags: stringArrayField(payload, "tags"),
    ...(stringField(payload, "description") ? { description: stringField(payload, "description") } : {}),
    ...(stringField(payload, "useCase") ? { useCase: stringField(payload, "useCase") } : {}),
    languages: stringArrayField(payload, "lang"),
    ...(stringField(payload, "age_rating") ? { ageRating: stringField(payload, "age_rating") } : {}),
    ...(developer?.name ? { developer } : {}),
    inAppPurchases: payload.IAP === true,
    ...(advertising ? { advertising } : {}),
    ...(communitySource ? { communitySource } : {}),
    source: "dstore",
    sourceUrl: dstoreCardUrl(id),
  };
}

async function getCardJson(id: number): Promise<unknown> {
  const response = await fetch(`${dstoreBaseUrl()}/${id}.json`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(dstoreTimeoutMs()),
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error(`dStore card ${id} was not found`);
    throw new Error(`dStore returned HTTP ${response.status} for card ${id}`);
  }
  return response.json();
}

export async function dstoreCardGet(ref: string | number): Promise<DstoreCard> {
  const id = parseDstoreCardId(ref);
  return normalizeDstoreCard(await getCardJson(id), id);
}

export async function dstoreCardsGet(refs: Array<string | number>): Promise<DstoreCardBatchResult> {
  const unique = Array.from(new Set(refs.map((ref) => String(ref).trim()).filter(Boolean)));
  const results = await Promise.allSettled(unique.map((ref) => dstoreCardGet(ref)));
  const cards: DstoreCard[] = [];
  const errors: Array<{ ref: string; error: string }> = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") cards.push(result.value);
    else errors.push({ ref: unique[index], error: result.reason instanceof Error ? result.reason.message : String(result.reason) });
  });
  return { cards, errors };
}

export async function dstorePlacementsSearch(args: DstorePlacementSearchArgs = {}): Promise<DstorePlacementSearchResult> {
  const params = new URLSearchParams();
  const fields: Array<[keyof DstorePlacementSearchArgs, string]> = [
    ["q", "q"], ["platform", "platform"], ["lang", "lang"], ["region", "region"],
    ["category", "category"], ["format", "format"], ["pricingModel", "pricingModel"],
    ["currency", "currency"], ["sort", "sort"], ["cursor", "cursor"],
  ];
  for (const [key, name] of fields) {
    const value = args[key];
    if (typeof value === "string" && value.trim()) params.set(name, value.trim());
  }
  const limit = args.limit == null ? 50 : Math.max(1, Math.min(50, Math.floor(args.limit)));
  params.set("limit", String(limit));
  const response = await fetch(`${dstoreCatalogBaseUrl()}/api/v1/catalog/placements?${params.toString()}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(dstoreTimeoutMs()),
  });
  if (!response.ok) throw new Error(`dStore placement catalog returned HTTP ${response.status}`);
  const payload: unknown = await response.json();
  if (!isObject(payload)) throw new Error("dStore placement catalog returned a non-object payload");
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  return {
    ...(stringField(payload, "schemaVersion") ? { schemaVersion: stringField(payload, "schemaVersion") } : {}),
    ...(stringField(payload, "generatedAt") ? { generatedAt: stringField(payload, "generatedAt") } : {}),
    ...(stringField(payload, "revision") ? { revision: stringField(payload, "revision") } : {}),
    items: rawItems.map(normalizeDstorePlacement).filter((item): item is DstorePlacement => Boolean(item)),
    ...(stringField(payload, "nextCursor") ? { nextCursor: stringField(payload, "nextCursor") } : {}),
  };
}
