import { Injectable } from '@nestjs/common';
import { ReportingDbService } from '../db/reportingDb.service';

export const IMPRESSIONS_FOR_80 = 5_000_000;
export const IMPRESSIONS_FOR_825 = 10_000_000;
export const IMPRESSIONS_FOR_85 = 15_000_000;

interface GetProModalRevenueShareParams {
  anniversaryOn: Date | null;
  displayRevenueShareOverride: number | null;
  owned: boolean;
  premiereAccepted: boolean;
  loyaltyBonusDisabled: boolean;
  net30RevenueSharePayments: boolean | null;
  siteId: number;
  targetDate: Date;
  impressionCount: number;
}

interface GetDisplayRevenueShareParams {
  anniversaryOn: Date | null;
  displayRevenueShareOverride: number | null;
  premiereAccepted: boolean;
  loyaltyBonusDisabled: boolean;
  impressionCount: number;
  net30RevenueSharePayments: boolean | null;
  siteId: number;
  targetDate: Date;
  owned: boolean;
  proAccepted: string | null;
}

interface CalculateRevenueShareParams {
  anniversaryOn: Date | null;
  displayRevenueShareOverride: number | null;
  premiereAccepted: boolean;
  loyaltyBonusDisabled: boolean;
  impressionCount: number;
  net30RevenueSharePayments: boolean | null;
  targetDate: Date;
  owned: boolean;
  proAccepted: string | null;
}

interface GetRevenueShareImpressionCountParams {
  siteId: number;
  targetDate: Date;
}

@Injectable()
export class RevenueShareService {
  constructor(private reportingDb: ReportingDbService) {}

  async getRevenueShareImpressionCount({
    siteId,
    targetDate,
  }: GetRevenueShareImpressionCountParams) {
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 31);
    const impressionCount = await this.reportingDb.revenue_reports.aggregate({
      where: {
        site_id: siteId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { paid_impressions: true },
    });
    return impressionCount._sum.paid_impressions || 0;
  }

  async getDisplayRevenueShare({
    anniversaryOn,
    displayRevenueShareOverride,
    siteId,
    loyaltyBonusDisabled,
    premiereAccepted,
    net30RevenueSharePayments,
    proAccepted,
    impressionCount,
    targetDate,
    owned,
  }: GetDisplayRevenueShareParams): Promise<{
    revenueShare: number;
    loyaltyRevenueShare: number;
    revenueShareWithoutLoyalty: number;
  }> {
    const healthCheck = await this.reportingDb.health_checks.findFirst({
      select: { revenue_share: true },
      where: { site_id: siteId, date: targetDate },
    });
    let revenueShare: number;
    if (healthCheck) {
      revenueShare = (healthCheck.revenue_share || 0) / 10_000;
    } else {
      revenueShare = this.calculateRevenueShare({
        targetDate,
        anniversaryOn,
        displayRevenueShareOverride,
        loyaltyBonusDisabled,
        net30RevenueSharePayments,
        premiereAccepted,
        proAccepted,
        impressionCount,
        owned,
      });
    }
    const loyaltyRevenueShare = getLoyaltyRevenueShare({
      anniversaryOn,
      targetDate,
      loyaltyBonusDisabled,
      premiereAccepted,
    });
    return {
      revenueShare,
      loyaltyRevenueShare,
      revenueShareWithoutLoyalty: revenueShare - loyaltyRevenueShare,
    };
  }

  calculateRevenueShare({
    anniversaryOn,
    displayRevenueShareOverride,
    loyaltyBonusDisabled,
    net30RevenueSharePayments,
    targetDate,
    owned,
    premiereAccepted,
    proAccepted,
    impressionCount,
  }: CalculateRevenueShareParams): number {
    let revenueShare: number;
    if (owned) {
      return 1;
    } else if (premiereAccepted) {
      revenueShare = 0.9;
    } else if (proAccepted === 'accepted') {
      revenueShare = calculateProRevShare({
        anniversaryOn,
        owned,
        premiereAccepted,
        loyaltyBonusDisabled,
        targetDate,
        impressionCount,
      });
    } else if (targetDate < new Date('2017-12-25')) {
      revenueShare = 0.7;
    } else if (proAccepted === 'na' && impressionCount >= IMPRESSIONS_FOR_80) {
      revenueShare = getBaseProRevenueShare({ impressionCount });
    } else {
      revenueShare = 0.75;
    }
    if (displayRevenueShareOverride) {
      revenueShare = Math.max(revenueShare, displayRevenueShareOverride / 100);
    }
    const loyaltyRevenueShare = getLoyaltyRevenueShareWithOwnedCheck({
      anniversaryOn,
      targetDate,
      owned,
      premiereAccepted,
      loyaltyBonusDisabled,
    });
    /**
     * In the case of proAccepted === 'accepted', the loyalty bonus has already been applied in calculateProRevShare
     */
    if (proAccepted !== 'accepted') {
      revenueShare += loyaltyRevenueShare;
    }
    if (net30RevenueSharePayments) {
      revenueShare = revenueShare - 0.025;
    }
    return revenueShare;
  }

  getProModalRevenueShare({
    anniversaryOn,
    displayRevenueShareOverride,
    owned,
    premiereAccepted,
    loyaltyBonusDisabled,
    net30RevenueSharePayments,
    targetDate,
    impressionCount,
  }: GetProModalRevenueShareParams) {
    let proRevShare = calculateProRevShare({
      anniversaryOn,
      owned,
      premiereAccepted,
      loyaltyBonusDisabled,
      targetDate,
      impressionCount,
    });
    if (displayRevenueShareOverride) {
      proRevShare = Math.max(proRevShare, displayRevenueShareOverride / 100);
    }
    if (net30RevenueSharePayments) {
      proRevShare = proRevShare - 0.025;
    }
    return proRevShare;
  }
}

interface GetLoyalRevenueShareParams {
  anniversaryOn: Date | null;
  targetDate: Date;
  premiereAccepted: boolean;
  loyaltyBonusDisabled: boolean;
}
function getLoyaltyRevenueShare({
  anniversaryOn,
  targetDate,
  loyaltyBonusDisabled,
  premiereAccepted,
}: GetLoyalRevenueShareParams) {
  if (
    loyaltyBonusDisabled ||
    premiereAccepted ||
    targetDate < new Date('2018-03-07')
  ) {
    return 0;
  }
  return Math.min(getLoyaltyAge({ anniversaryOn, targetDate }), 5) / 100;
}

/**
 * Although there isn't actually a loyalty bonus for owned sites (revenue_share is always 1 in reality),
 * the existing Rails API returns a loyalty_bonus in the API. The revenue_share returned from the
 * API is 1 - loyalty_bonus. So if you have an owned site that is 3 years old, you end up with a
 * loyalty_bonus of 0.03 and revenue_share of 0.97.
 * I maintain this behavior to ensure compatability, but it seems like returning a loyalty_bonus
 * of 1 with 0 loyalty_bonus for an owned site would be more truthful.
 * If we end up being able to make that change in the future, we could just add the owned check
 * here to `getLoyaltyRevenueShare` and remove this function.
 */
function getLoyaltyRevenueShareWithOwnedCheck(
  params: GetLoyalRevenueShareParams & { owned: boolean },
) {
  if (params.owned) {
    return 0;
  }
  return getLoyaltyRevenueShare(params);
}

interface GetLoyaltyAgeParams {
  anniversaryOn: Date | null;
  targetDate: Date;
}
function getLoyaltyAge({ anniversaryOn, targetDate }: GetLoyaltyAgeParams) {
  if (!anniversaryOn) {
    return 0;
  }
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);
  let yearsDiff = nextDay.getFullYear() - anniversaryOn.getFullYear();
  if (
    anniversaryOn.getMonth() > nextDay.getMonth() ||
    (anniversaryOn.getMonth() === nextDay.getMonth() &&
      anniversaryOn.getDate() > nextDay.getDate())
  ) {
    // Subtract one if the anniversary has not already passed this year
    yearsDiff = yearsDiff - 1;
  }
  return Math.max(yearsDiff, 0);
}

interface CalculateProRevShareParams {
  anniversaryOn: Date | null;
  impressionCount: number;
  targetDate: Date;
  owned: boolean;
  premiereAccepted: boolean;
  loyaltyBonusDisabled: boolean;
}
function calculateProRevShare({
  anniversaryOn,
  impressionCount,
  targetDate,
  premiereAccepted,
  loyaltyBonusDisabled,
  owned,
}: CalculateProRevShareParams) {
  const loyalty = getLoyaltyRevenueShareWithOwnedCheck({
    anniversaryOn,
    targetDate,
    owned,
    premiereAccepted,
    loyaltyBonusDisabled,
  });
  const base = getBaseProRevenueShare({ impressionCount });
  return Math.max(base + loyalty, 0.85);
}

interface GetBaseProRevenueShareParams {
  impressionCount: number;
}

function getBaseProRevenueShare({
  impressionCount,
}: GetBaseProRevenueShareParams) {
  if (impressionCount >= IMPRESSIONS_FOR_85) {
    return 0.85;
  } else if (impressionCount >= IMPRESSIONS_FOR_825) {
    return 0.825;
  }
  return 0.8;
}
