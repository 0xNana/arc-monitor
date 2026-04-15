export interface LatestMetrics {
  updated: string
  contractAddress: string
  chainId: number
  sampleCount: number
  successfulSamples: number
  failedSamples: number
  successRatePct: number
  latency: {
    p50Ms: number
    p95Ms: number
    p99Ms: number
    avgMs: number
  }
  fee: {
    targetUsdc: number
    avgUsdc: number
    p50Usdc: number
    p95Usdc: number
    p99Usdc: number
    spreadUsdc: number
    avgGasPriceGwei: number
    avgGasUsed: number
    avgBaseFeeGwei: number
    volatilityPct: number
  }
  finality: {
    avgMs: number
    p95Ms: number
    under1sRatePct: number
    successRatePct: number
    reorgsObserved: number
    deterministic: boolean
  }
}

export interface HistoryPoint {
  timestamp: string
  time: string
  latencyP50Ms: number
  latencyP95Ms: number
  latencyP99Ms: number
  feeAvgUsdc: number
  feeP50Usdc: number
  feeP95Usdc: number
  feeP99Usdc: number
  feeSpreadUsdc: number
  avgGasPriceGwei: number
  avgGasUsed: number
  avgBaseFeeGwei: number
  finalityAvgMs: number
  finalityP95Ms: number
  finalityUnder1sRatePct: number
  successRatePct: number
  sampleCount: number
  successfulSamples: number
  failedSamples: number
}

export type TimeInterval = '24h' | '48h' | '7d' | '30d'

export const dashboardTimeIntervals: TimeInterval[] = ['24h', '48h', '7d', '30d']

const historyWindowSizes: Record<TimeInterval, number> = {
  '24h': 24,
  '48h': 48,
  '7d': 168,
  '30d': 720,
}

export const defaultLatestMetrics: LatestMetrics = {
  updated: 'Never',
  contractAddress: process.env.NEXT_PUBLIC_LATENCY_CONTRACT || 'Not configured',
  chainId: 5042002,
  sampleCount: 0,
  successfulSamples: 0,
  failedSamples: 0,
  successRatePct: 0,
  latency: {
    p50Ms: 0,
    p95Ms: 0,
    p99Ms: 0,
    avgMs: 0,
  },
  fee: {
    targetUsdc: 0.01,
    avgUsdc: 0,
    p50Usdc: 0,
    p95Usdc: 0,
    p99Usdc: 0,
    spreadUsdc: 0,
    avgGasPriceGwei: 0,
    avgGasUsed: 0,
    avgBaseFeeGwei: 0,
    volatilityPct: 0,
  },
  finality: {
    avgMs: 0,
    p95Ms: 0,
    under1sRatePct: 0,
    successRatePct: 0,
    reorgsObserved: 0,
    deterministic: true,
  },
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function stringOrFallback(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function averageOfLegacyLatency(p50: number, p95: number): number {
  if (p50 && p95) return (p50 + p95) / 2
  return p95 || p50 || 0
}

export function normalizeLatestMetrics(raw: unknown): LatestMetrics {
  if (!raw || typeof raw !== 'object') {
    return defaultLatestMetrics
  }

  const data = raw as Record<string, unknown>
  const legacyP50 = numberOrZero(data.p50)
  const legacyP95 = numberOrZero(data.p95)
  const legacyP99 = numberOrZero(data.p99)
  const legacyAvg = legacyP50 && legacyP95 ? (legacyP50 + legacyP95) / 2 : legacyP95

  const latency = (data.latency ?? {}) as Record<string, unknown>
  const fee = (data.fee ?? {}) as Record<string, unknown>
  const finality = (data.finality ?? {}) as Record<string, unknown>

  const sampleCount = numberOrZero(data.sampleCount)
  const successfulSamples = numberOrZero(data.successfulSamples)
  const failedSamples = numberOrZero(data.failedSamples)
  const successRatePct =
    numberOrZero(data.successRatePct) ||
    numberOrZero(finality.successRatePct) ||
    (sampleCount > 0 ? (successfulSamples / sampleCount) * 100 : 0)

  return {
    updated: stringOrFallback(data.updated, defaultLatestMetrics.updated),
    contractAddress: stringOrFallback(
      data.contractAddress,
      process.env.NEXT_PUBLIC_LATENCY_CONTRACT || defaultLatestMetrics.contractAddress
    ),
    chainId: numberOrZero(data.chainId) || defaultLatestMetrics.chainId,
    sampleCount,
    successfulSamples,
    failedSamples,
    successRatePct,
    latency: {
      p50Ms: numberOrZero(latency.p50Ms) || legacyP50,
      p95Ms: numberOrZero(latency.p95Ms) || legacyP95,
      p99Ms: numberOrZero(latency.p99Ms) || legacyP99,
      avgMs: numberOrZero(latency.avgMs) || legacyAvg,
    },
    fee: {
      targetUsdc: numberOrZero(fee.targetUsdc) || defaultLatestMetrics.fee.targetUsdc,
      avgUsdc: numberOrZero(fee.avgUsdc),
      p50Usdc: numberOrZero(fee.p50Usdc),
      p95Usdc: numberOrZero(fee.p95Usdc),
      p99Usdc: numberOrZero(fee.p99Usdc),
      spreadUsdc: numberOrZero(fee.spreadUsdc),
      avgGasPriceGwei: numberOrZero(fee.avgGasPriceGwei),
      avgGasUsed: numberOrZero(fee.avgGasUsed),
      avgBaseFeeGwei: numberOrZero(fee.avgBaseFeeGwei),
      volatilityPct: numberOrZero(fee.volatilityPct),
    },
    finality: {
      avgMs: numberOrZero(finality.avgMs) || legacyAvg,
      p95Ms: numberOrZero(finality.p95Ms) || legacyP95,
      under1sRatePct: numberOrZero(finality.under1sRatePct),
      successRatePct,
      reorgsObserved: numberOrZero(finality.reorgsObserved),
      deterministic:
        typeof finality.deterministic === 'boolean' ? finality.deterministic : true,
    },
  }
}

export function normalizeHistoryData(raw: unknown): HistoryPoint[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.map((entry) => {
    const point = (entry ?? {}) as Record<string, unknown>
    const timestamp = stringOrFallback(point.timestamp, '')
    const time = stringOrFallback(
      point.time,
      timestamp ? timestamp.slice(11, 16) : '--:--'
    )

    return {
      timestamp: timestamp || new Date().toISOString(),
      time,
      latencyP50Ms: numberOrZero(point.latencyP50Ms) || numberOrZero(point.p50),
      latencyP95Ms: numberOrZero(point.latencyP95Ms) || numberOrZero(point.p95),
      latencyP99Ms: numberOrZero(point.latencyP99Ms) || numberOrZero(point.p99),
      feeAvgUsdc: numberOrZero(point.feeAvgUsdc),
      feeP50Usdc: numberOrZero(point.feeP50Usdc),
      feeP95Usdc: numberOrZero(point.feeP95Usdc),
      feeP99Usdc: numberOrZero(point.feeP99Usdc),
      feeSpreadUsdc: numberOrZero(point.feeSpreadUsdc),
      avgGasPriceGwei: numberOrZero(point.avgGasPriceGwei),
      avgGasUsed: numberOrZero(point.avgGasUsed),
      avgBaseFeeGwei: numberOrZero(point.avgBaseFeeGwei),
      finalityAvgMs:
        numberOrZero(point.finalityAvgMs) ||
        averageOfLegacyLatency(numberOrZero(point.p50), numberOrZero(point.p95)),
      finalityP95Ms: numberOrZero(point.finalityP95Ms) || numberOrZero(point.p95),
      finalityUnder1sRatePct: numberOrZero(point.finalityUnder1sRatePct),
      successRatePct: numberOrZero(point.successRatePct),
      sampleCount: numberOrZero(point.sampleCount),
      successfulSamples: numberOrZero(point.successfulSamples),
      failedSamples: numberOrZero(point.failedSamples),
    }
  })
}

export function filterHistoryByTimeInterval(
  history: HistoryPoint[],
  interval: TimeInterval
): HistoryPoint[] {
  return history.slice(-historyWindowSizes[interval])
}

export function formatUsdc(value: number): string {
  return `${value.toFixed(value >= 0.01 ? 4 : 5)}`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}`
}

export type HealthStatus = 'Nominal' | 'Watch' | 'Degraded'

export function getHealthStatus(input: {
  successRatePct: number
  finalityUnder1sRatePct: number
  feeVolatilityPct: number
  latencyP99Ms: number
}): HealthStatus {
  if (
    input.successRatePct >= 99 &&
    input.finalityUnder1sRatePct >= 90 &&
    input.feeVolatilityPct <= 15 &&
    input.latencyP99Ms <= 1500
  ) {
    return 'Nominal'
  }

  if (
    input.successRatePct >= 90 &&
    input.finalityUnder1sRatePct >= 75 &&
    input.feeVolatilityPct <= 35 &&
    input.latencyP99Ms <= 2500
  ) {
    return 'Watch'
  }

  return 'Degraded'
}

export function getStatusTone(status: HealthStatus): string {
  if (status === 'Nominal') return 'bg-emerald-500/10 text-emerald-500'
  if (status === 'Watch') return 'bg-amber-500/10 text-amber-400'
  return 'bg-red-500/10 text-red-400'
}

export function formatTimestampLabel(timestamp: string, fallbackTime: string): string {
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) {
    return fallbackTime
  }

  const month = `${parsed.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${parsed.getUTCDate()}`.padStart(2, '0')
  const hours = `${parsed.getUTCHours()}`.padStart(2, '0')
  const minutes = `${parsed.getUTCMinutes()}`.padStart(2, '0')

  return `${month}-${day} ${hours}:${minutes}`
}

export function formatXAxisLabel(timestamp: string, fallbackTime: string, condensed = false): string {
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) {
    return fallbackTime
  }

  const now = new Date()
  const diffMs = Math.abs(now.getTime() - parsed.getTime())
  const isWithinDay = diffMs <= 24 * 60 * 60 * 1000

  if (isWithinDay) {
    return `${`${parsed.getUTCHours()}`.padStart(2, '0')}:${`${parsed.getUTCMinutes()}`.padStart(2, '0')}`
  }

  const month = `${parsed.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${parsed.getUTCDate()}`.padStart(2, '0')

  return condensed ? `${month}-${day}` : `${month}-${day} UTC`
}
