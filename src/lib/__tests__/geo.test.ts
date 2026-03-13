import { describe, it, expect } from 'vitest'
import { haversineDistance, formatDistance, stopsNearPolyline } from '../geo'

describe('haversineDistance', () => {
  it('returns 0 for same point', () => {
    expect(haversineDistance(19.53, -96.92, 19.53, -96.92)).toBe(0)
  })

  it('calculates known distance (Xalapa centro ≈ 1.1km north)', () => {
    // ~0.01 deg lat ≈ 1.11 km
    const dist = haversineDistance(19.53, -96.92, 19.54, -96.92)
    expect(dist).toBeGreaterThan(1000)
    expect(dist).toBeLessThan(1200)
  })

  it('is symmetric', () => {
    const ab = haversineDistance(19.53, -96.92, 19.55, -96.90)
    const ba = haversineDistance(19.55, -96.90, 19.53, -96.92)
    expect(Math.abs(ab - ba)).toBeLessThan(0.01)
  })
})

describe('formatDistance', () => {
  it('formats meters', () => {
    expect(formatDistance(250)).toBe('250 m')
  })

  it('formats kilometers', () => {
    expect(formatDistance(1500)).toBe('1.5 km')
  })

  it('rounds meters', () => {
    expect(formatDistance(123.7)).toBe('124 m')
  })

  it('returns dash for NaN', () => {
    expect(formatDistance(NaN)).toBe('—')
  })

  it('returns dash for Infinity', () => {
    expect(formatDistance(Infinity)).toBe('—')
  })

  it('returns dash for negative Infinity', () => {
    expect(formatDistance(-Infinity)).toBe('—')
  })
})

describe('stopsNearPolyline', () => {
  const stops = {
    features: [
      { properties: { stop_id: 1 }, geometry: { coordinates: [-96.92, 19.53] as [number, number] } },
      { properties: { stop_id: 2 }, geometry: { coordinates: [-96.92, 19.535] as [number, number] } },
      { properties: { stop_id: 3 }, geometry: { coordinates: [-96.90, 19.60] as [number, number] } }, // far away
    ],
  }

  const polyline: [number, number][] = [
    [-96.92, 19.529],
    [-96.92, 19.536],
  ]

  it('includes stops within radius', () => {
    const ids = stopsNearPolyline(stops, polyline, 200)
    expect(ids.has(1)).toBe(true)
    expect(ids.has(2)).toBe(true)
  })

  it('excludes stops outside radius', () => {
    const ids = stopsNearPolyline(stops, polyline, 200)
    expect(ids.has(3)).toBe(false)
  })
})
