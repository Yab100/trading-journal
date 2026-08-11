export type TradingSession =
  | 'Asia'
  | 'London'
  | 'New York'
  | 'London / New York Overlap'
  | 'Other'

/**
 * Determines the trading session from the trade's actual entry date/time.
 *
 * The calculation uses UTC so historical trades remain consistent,
 * regardless of the user's current timezone or when the trade was edited.
 *
 * Session windows:
 * Asia:       00:00 - 07:59 UTC
 * London:     08:00 - 12:59 UTC
 * London/NY:  13:00 - 16:59 UTC
 * New York:   17:00 - 21:59 UTC
 * Other:      22:00 - 23:59 UTC
 */
export function getTradingSession(
  entryDate: string | Date
): TradingSession {
  const date =
    entryDate instanceof Date
      ? entryDate
      : new Date(entryDate)

  if (Number.isNaN(date.getTime())) {
    return 'Other'
  }

  const hour = date.getUTCHours()

  if (hour >= 0 && hour < 8) {
    return 'Asia'
  }

  if (hour >= 8 && hour < 13) {
    return 'London'
  }

  if (hour >= 13 && hour < 17) {
    return 'London / New York Overlap'
  }

  if (hour >= 17 && hour < 22) {
    return 'New York'
  }

  return 'Other'
}