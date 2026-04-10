/**
 * Usage Service
 * Fetches the authenticated user's current billing period usage
 */

import { apiGet } from './api-client';

export interface UsageData {
  plan: 'free' | 'premium';
  limit: number;
  used: number;
  remaining: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  isOverride: boolean;
}

interface UsageResponse {
  success: boolean;
  plan: string;
  limit: number;
  used: number;
  remaining: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  isOverride: boolean;
}

export const getUsage = async (): Promise<UsageData> => {
  const data = await apiGet<UsageResponse>('/usage');
  return {
    plan: data.plan as 'free' | 'premium',
    limit: data.limit,
    used: data.used,
    remaining: data.remaining,
    billingPeriodStart: data.billingPeriodStart,
    billingPeriodEnd: data.billingPeriodEnd,
    isOverride: data.isOverride,
  };
};
