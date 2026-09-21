import { apiFetch } from "./api";

export interface ProductRecommendation {
  id: string;
  name: string;
  imageUrl: string;
  basePrice: number;
}

export async function getWeekdayRecommendations(): Promise<ProductRecommendation[]> {
  return apiFetch<ProductRecommendation[]>("/recommendations/weekday");
}

export async function getLastOrderRecommendations(): Promise<ProductRecommendation[]> {
  return apiFetch<ProductRecommendation[]>("/recommendations/last-order");
}