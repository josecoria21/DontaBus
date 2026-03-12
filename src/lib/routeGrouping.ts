import type { RouteFeature } from '../types'

const DIRECTION_ORDER: Record<string, number> = {
  ida: 0,
  vuelta: 1,
  ruta_1: 0,
  ruta_2: 1,
  variant_1: 0,
  variant_2: 1,
  main: 0,
}

/** Returns the group key (everything before `__`) to identify sibling routes */
export function getRouteGroupKey(props: { route_key: string }): string {
  const idx = props.route_key.indexOf('__')
  return idx === -1 ? props.route_key : props.route_key.slice(0, idx)
}

/** Returns all features sharing the same group key, sorted by direction order */
export function getSiblingRoutes(
  currentRouteKey: string,
  allFeatures: RouteFeature[],
): RouteFeature[] {
  const groupKey = getRouteGroupKey({ route_key: currentRouteKey })
  return allFeatures
    .filter((f) => getRouteGroupKey(f.properties) === groupKey)
    .sort(
      (a, b) =>
        (DIRECTION_ORDER[a.properties.direction] ?? 99) -
        (DIRECTION_ORDER[b.properties.direction] ?? 99),
    )
}
