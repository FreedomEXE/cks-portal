import useSWR from "swr";
import { apiFetch, type ApiResponse } from "./client";

type CatalogType = "product" | "service";

export interface CatalogItemPrice {
  amount: string;
  currency: string;
  unitOfMeasure: string | null;
}

export interface CatalogProductDetails {
  sku: string | null;
  packageSize: string | null;
  leadTimeDays: number | null;
  reorderPoint: number | null;
  attributes: Record<string, unknown> | null;
}

export interface CatalogServiceDetails {
  durationMinutes: number | null;
  serviceWindow: string | null;
  attributes: Record<string, unknown> | null;
}

export interface CatalogItem {
  code: string;
  name: string;
  type: CatalogType;
  category: string | null;
  description: string | null;
  tags: string[];
  imageUrl: string | null;
  unitOfMeasure: string | null;
  price: CatalogItemPrice | null;
  metadata: Record<string, unknown> | null;
  product?: CatalogProductDetails | null;
  service?: CatalogServiceDetails | null;
  managedBy?: string | null;
}

export interface CatalogPage {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CatalogListResult {
  items: CatalogItem[];
  page: CatalogPage;
}

export interface FetchCatalogParams {
  type?: CatalogType;
  category?: string;
  q?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
}

export async function fetchCatalogItems(params: FetchCatalogParams = {}): Promise<CatalogListResult> {
  const searchParams = new URLSearchParams();
  if (params.type) {
    searchParams.set("type", params.type);
  }
  if (params.category) {
    searchParams.set("category", params.category);
  }
  if (params.q) {
    searchParams.set("q", params.q);
  }
  if (params.tags && params.tags.length > 0) {
    searchParams.set("tags", params.tags.join(","));
  }
  if (params.page) {
    searchParams.set("page", String(params.page));
  }
  if (params.pageSize) {
    searchParams.set("pageSize", String(params.pageSize));
  }

  const queryString = searchParams.toString();
  const url = `/catalog/items${queryString ? "?" + queryString : ""}`;
  const response = await apiFetch<ApiResponse<CatalogListResult>>(url);
  return response.data;
}

export function useCatalogItems(params: FetchCatalogParams) {
  const key = [
    "catalog",
    params.type ?? "all",
    params.category ?? "",
    params.q ?? "",
    (params.tags ?? []).join("|"),
    params.page ?? 1,
    params.pageSize ?? 20,
  ];
  const fetcher = () => fetchCatalogItems(params);
  const { data, error, isLoading } = useSWR<CatalogListResult>(key, fetcher);
  return {
    data: data ?? null,
    isLoading,
    error,
  };
}
