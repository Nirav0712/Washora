import { ReportDateRangePreset, MetricDelta } from '@washora/shared';

export interface CalculatedDateRanges {
  current: {
    from: Date;
    to: Date;
  };
  previous: {
    from: Date;
    to: Date;
  };
  preset?: ReportDateRangePreset;
}

export class ReportsDateUtil {
  static parseDateRange(
    preset?: ReportDateRangePreset,
    customFrom?: string,
    customTo?: string,
  ): CalculatedDateRanges {
    const now = new Date();
    const effectivePreset = preset || (customFrom ? ReportDateRangePreset.CUSTOM : ReportDateRangePreset.THIS_MONTH);

    let from: Date;
    let to: Date;
    let prevFrom: Date;
    let prevTo: Date;

    switch (effectivePreset) {
      case ReportDateRangePreset.TODAY: {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        prevFrom = new Date(from.getTime() - 24 * 60 * 60 * 1000);
        prevTo = new Date(to.getTime() - 24 * 60 * 60 * 1000);
        break;
      }

      case ReportDateRangePreset.YESTERDAY: {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        prevFrom = new Date(from.getTime() - 24 * 60 * 60 * 1000);
        prevTo = new Date(to.getTime() - 24 * 60 * 60 * 1000);
        break;
      }

      case ReportDateRangePreset.THIS_WEEK: {
        const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const weekDuration = 7 * 24 * 60 * 60 * 1000;
        prevFrom = new Date(from.getTime() - weekDuration);
        prevTo = new Date(to.getTime() - weekDuration);
        break;
      }

      case ReportDateRangePreset.LAST_WEEK: {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const startThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
        from = new Date(startThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
        to = new Date(from.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 3600000 + 59 * 60000 + 59999);
        prevFrom = new Date(from.getTime() - 7 * 24 * 60 * 60 * 1000);
        prevTo = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      }

      case ReportDateRangePreset.THIS_MONTH: {
        from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        prevTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      }

      case ReportDateRangePreset.LAST_MONTH: {
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        prevFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
        prevTo = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
        break;
      }

      case ReportDateRangePreset.THIS_QUARTER: {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        from = new Date(now.getFullYear(), currentQuarter * 3, 1, 0, 0, 0, 0);
        to = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
        prevFrom = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1, 0, 0, 0, 0);
        prevTo = new Date(now.getFullYear(), currentQuarter * 3, 0, 23, 59, 59, 999);
        break;
      }

      case ReportDateRangePreset.LAST_QUARTER: {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        from = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1, 0, 0, 0, 0);
        to = new Date(now.getFullYear(), currentQuarter * 3, 0, 23, 59, 59, 999);
        prevFrom = new Date(now.getFullYear(), (currentQuarter - 2) * 3, 1, 0, 0, 0, 0);
        prevTo = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 0, 23, 59, 59, 999);
        break;
      }

      case ReportDateRangePreset.THIS_YEAR: {
        from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        prevFrom = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
        prevTo = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      }

      case ReportDateRangePreset.LAST_YEAR: {
        from = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
        to = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        prevFrom = new Date(now.getFullYear() - 2, 0, 1, 0, 0, 0, 0);
        prevTo = new Date(now.getFullYear() - 2, 11, 31, 23, 59, 59, 999);
        break;
      }

      case ReportDateRangePreset.CUSTOM:
      default: {
        from = customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        to = customTo ? new Date(customTo) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        // Duration shift for previous period
        const durationMs = Math.max(1, to.getTime() - from.getTime());
        prevTo = new Date(from.getTime() - 1);
        prevFrom = new Date(prevTo.getTime() - durationMs);
        break;
      }
    }

    return {
      current: { from, to },
      previous: { from: prevFrom, to: prevTo },
      preset: effectivePreset,
    };
  }

  static calculateDelta(current: number, previous: number): MetricDelta {
    const cur = Number(current) || 0;
    const prev = Number(previous) || 0;
    const absoluteChange = Number((cur - prev).toFixed(2));

    let percentageChange: number | null = null;
    if (prev > 0) {
      percentageChange = Number((((cur - prev) / prev) * 100).toFixed(1));
    } else if (prev === 0 && cur > 0) {
      percentageChange = 100; // 100% gain from 0 baseline
    } else if (prev === 0 && cur === 0) {
      percentageChange = 0;
    }

    let trend: 'UP' | 'DOWN' | 'FLAT' = 'FLAT';
    if (cur > prev) trend = 'UP';
    else if (cur < prev) trend = 'DOWN';

    return {
      current: Number(cur.toFixed(2)),
      previous: Number(prev.toFixed(2)),
      absoluteChange,
      percentageChange,
      trend,
    };
  }

  static formatIsoDay(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
