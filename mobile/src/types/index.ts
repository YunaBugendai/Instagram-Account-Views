export interface EstimateFormInput {
  username: string;
  followers: number;
  following: number;
  posts: number;
}

export interface EstimateBreakdown {
  base: number;
  activityFactor: number;
  popularityFactor: number;
  dailyVariationPercent: number;
}

export interface EstimateResponse {
  estimatedViews: number;
  breakdown: EstimateBreakdown;
  status: DailyStatus;
}

export interface DailyStatus {
  remaining: number;
  limit: number;
}

export type RootStackParamList = {
  Home: undefined;
  Result: { username: string; result: EstimateResponse };
};
