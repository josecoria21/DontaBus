import { describe, it, expect } from 'vitest'
import { recommendDirection } from '../directionRecommender'
import type { RouteFeature, StopsGeoJSON, RouteStopsData } from '../../types'

function makeFeature(routeKey: string, direction: string): RouteFeature {
  return {
    type: 'Feature',
    properties: {
      route_key: routeKey,
      route_num: '1',
      route_type: 'ruta',
      direction,
      name: 'Test',
      vehicle_type: null,
      image_url: null,
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

function makeStops(ids: { id: number; lat: number; lng: number }[]): StopsGeoJSON {
  return {
    type: 'FeatureCollection',
    features: ids.map((s) => ({
      type: 'Feature' as const,
      properties: { stop_id: s.id, original_count: 1, num_routes: 1 },
      geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] as [number, number] },
    })),
  }
}

describe('recommendDirection', () => {
  const stops = makeStops([
    { id: 1, lat: 19.53, lng: -96.92 },
    { id: 2, lat: 19.535, lng: -96.92 },
    { id: 3, lat: 19.54, lng: -96.92 },
    { id: 4, lat: 19.545, lng: -96.92 },
    { id: 5, lat: 19.55, lng: -96.92 },
  ])

  const idaFeature = makeFeature('ruta_1__ida', 'ida')
  const vueltaFeature = makeFeature('ruta_1__vuelta', 'vuelta')
  const allFeatures = [idaFeature, vueltaFeature]

  const routeStops: RouteStopsData = {
    'ruta_1__ida': [
      { stop_id: 1, sequence: 1, travel_time: 60, dwell_time: 10 },
      { stop_id: 2, sequence: 2, travel_time: 60, dwell_time: 10 },
      { stop_id: 3, sequence: 3, travel_time: 60, dwell_time: 10 },
      { stop_id: 4, sequence: 4, travel_time: 60, dwell_time: 10 },
      { stop_id: 5, sequence: 5, travel_time: 60, dwell_time: 10 },
    ],
    'ruta_1__vuelta': [
      { stop_id: 5, sequence: 1, travel_time: 60, dwell_time: 10 },
      { stop_id: 4, sequence: 2, travel_time: 60, dwell_time: 10 },
      { stop_id: 3, sequence: 3, travel_time: 60, dwell_time: 10 },
      { stop_id: 2, sequence: 4, travel_time: 60, dwell_time: 10 },
      { stop_id: 1, sequence: 5, travel_time: 60, dwell_time: 10 },
    ],
  }

  it('picks forward direction when user is before destination', () => {
    const user = { lat: 19.53, lng: -96.92 }  // near stop 1
    const dest = { lat: 19.55, lng: -96.92 }   // near stop 5
    const result = recommendDirection(user, dest, 'ruta_1__ida', allFeatures, routeStops, stops)
    expect(result).not.toBeNull()
    expect(result!.direction).toBe('ida')
    expect(result!.rideStops).toBeGreaterThan(0)
  })

  it('picks vuelta when user needs reverse direction', () => {
    const user = { lat: 19.55, lng: -96.92 }  // near stop 5
    const dest = { lat: 19.53, lng: -96.92 }   // near stop 1
    const result = recommendDirection(user, dest, 'ruta_1__ida', allFeatures, routeStops, stops)
    expect(result).not.toBeNull()
    expect(result!.direction).toBe('vuelta')
  })

  it('backward wrap-around count uses actual stop filtering', () => {
    // Circuit route: stops 1→2→3→4→5 loop back
    const circuitFeature = makeFeature('circuit_1__main', 'main')
    const circuitStops: RouteStopsData = {
      'circuit_1__main': [
        { stop_id: 1, sequence: 1, travel_time: 60, dwell_time: 10 },
        { stop_id: 2, sequence: 3, travel_time: 60, dwell_time: 10 }, // gap in sequence
        { stop_id: 3, sequence: 5, travel_time: 60, dwell_time: 10 },
        { stop_id: 4, sequence: 7, travel_time: 60, dwell_time: 10 },
        { stop_id: 5, sequence: 9, travel_time: 60, dwell_time: 10 },
      ],
    }

    const user = { lat: 19.54, lng: -96.92 }   // near stop 3 (seq 5)
    const dest = { lat: 19.53, lng: -96.92 }    // near stop 1 (seq 1)

    const result = recommendDirection(
      user, dest, 'circuit_1__main',
      [circuitFeature], circuitStops, stops,
    )
    expect(result).not.toBeNull()
    // Backward: stops with sequence > 5 (boardStop) OR sequence <= 1 (alightStop)
    // That's stop 4 (seq 7), stop 5 (seq 9), and stop 1 (seq 1) = 3 stops
    expect(result!.rideStops).toBe(3)
  })

  it('skips stops with missing locations', () => {
    const partialStops = makeStops([
      { id: 1, lat: 19.53, lng: -96.92 },
      { id: 3, lat: 19.54, lng: -96.92 },
    ])
    const user = { lat: 19.53, lng: -96.92 }
    const dest = { lat: 19.54, lng: -96.92 }
    const result = recommendDirection(user, dest, 'ruta_1__ida', allFeatures, routeStops, partialStops)
    expect(result).not.toBeNull()
  })

  it('shortest ride time wins among forward candidates', () => {
    const user = { lat: 19.53, lng: -96.92 }
    const dest = { lat: 19.535, lng: -96.92 }  // near stop 2 — short ride on ida
    const result = recommendDirection(user, dest, 'ruta_1__ida', allFeatures, routeStops, stops)
    expect(result).not.toBeNull()
    // ida: 1→2 is 1 stop; vuelta: 1→4→3→2 is 3 stops. Forward wins with shorter time.
    expect(result!.direction).toBe('ida')
    expect(result!.rideStops).toBe(1)
  })

  it('returns null when no sibling routes exist', () => {
    const lonely = makeFeature('orphan_route', 'main')
    // orphan_route has no entry in routeStops
    const result = recommendDirection(
      { lat: 19.53, lng: -96.92 }, { lat: 19.55, lng: -96.92 },
      'orphan_route', [lonely], routeStops, stops,
    )
    expect(result).toBeNull()
  })
})
