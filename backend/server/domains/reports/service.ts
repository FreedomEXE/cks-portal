import { Timeframe } from './types';
import * as repo from './repository';

export async function getSummary(timeframe: Timeframe = 'month') {
  const [statusCounts, revenueTrend] = await Promise.all([
    repo.getOrderStatusCounts(),
    repo.getRevenueTrend(timeframe, 6)
  ]);
  return { statusCounts, revenueTrend };
}

