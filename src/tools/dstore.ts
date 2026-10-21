import {
  dstoreBaseUrl,
  dstoreCardGet,
  dstoreCardsGet,
  dstoreCatalogBaseUrl,
  dstorePlacementsSearch,
  dstoreTimeoutMs,
  type DstorePlacementSearchArgs,
} from "../dstore/client.js";

export function runDstoreStatus() {
  return {
    configured: true,
    base_url: dstoreBaseUrl(),
    catalog_url: dstoreCatalogBaseUrl(),
    timeout_ms: dstoreTimeoutMs(),
    mode: "read-only-card-and-placement-adapter",
    hint: "Use ads_dstore_search for verified advertising inventory and ads_dstore_card_get for a known card. For open community proposals, configure the separate AIKI MCP with ads_aiki_setup_guide; only dStore-verified placements are inventory.",
  };
}

export function runDstoreCardGet(args: { id_or_url: string }) {
  return dstoreCardGet(args.id_or_url);
}

export function runDstoreCardsGet(args: { ids_or_urls: string[] }) {
  return dstoreCardsGet(args.ids_or_urls);
}

export function runDstorePlacementsSearch(args: DstorePlacementSearchArgs) {
  return dstorePlacementsSearch(args);
}
