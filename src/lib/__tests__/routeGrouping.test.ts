import { describe, it, expect } from 'vitest'
import { getRouteGroupKey, getSiblingRoutes } from '../routeGrouping'
import type { RouteFeature } from '../../types'

function makeFeature(routeKey: string, direction: string): RouteFeature {
  return {
    type: 'Feature',
    properties: {
      route_key: routeKey,
      route_num: '1',
      route_type: 'ruta',
      direction,
      name: 'Test',
      description: null,
      notes: null,
      peak_am: null,
      midday: null,
      peak_pm: null,
      night: null,
    },
    geometry: { type: 'LineString', coordinates: [] },
  }
}

describe('getRouteGroupKey', () => {
  it('extracts group key before __', () => {
    expect(getRouteGroupKey({ route_key: 'ruta_1__ida' })).toBe('ruta_1')
  })

  it('returns full key when no __ present', () => {
    expect(getRouteGroupKey({ route_key: 'circuito_5' })).toBe('circuito_5')
  })

  it('handles multiple __ by splitting at first', () => {
    expect(getRouteGroupKey({ route_key: 'ruta_1__ida__extra' })).toBe('ruta_1')
  })
})

describe('getSiblingRoutes', () => {
  const features = [
    makeFeature('ruta_1__ida', 'ida'),
    makeFeature('ruta_1__vuelta', 'vuelta'),
    makeFeature('ruta_2__ida', 'ida'),
  ]

  it('finds both directions for a route', () => {
    const siblings = getSiblingRoutes('ruta_1__ida', features)
    expect(siblings).toHaveLength(2)
    expect(siblings.map((s) => s.properties.route_key)).toContain('ruta_1__ida')
    expect(siblings.map((s) => s.properties.route_key)).toContain('ruta_1__vuelta')
  })

  it('sorts by direction order (ida before vuelta)', () => {
    const siblings = getSiblingRoutes('ruta_1__vuelta', features)
    expect(siblings[0].properties.direction).toBe('ida')
    expect(siblings[1].properties.direction).toBe('vuelta')
  })

  it('returns only self when no siblings', () => {
    const siblings = getSiblingRoutes('ruta_2__ida', features)
    expect(siblings).toHaveLength(1)
    expect(siblings[0].properties.route_key).toBe('ruta_2__ida')
  })

  it('returns empty when route not found', () => {
    const siblings = getSiblingRoutes('nonexistent', features)
    expect(siblings).toHaveLength(0)
  })
})
