import { create } from 'zustand'
import type { RouteFeature, RouteProperties } from '../types'

const STORAGE_KEY = 'dontabus-custom-routes'

function loadFromStorage(): RouteFeature[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function persistToStorage(routes: RouteFeature[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routes))
  } catch { /* ignore */ }
}

function buildRouteKey(routeNum: string, direction: string): string {
  const slug = routeNum.trim().toLowerCase().replace(/\s+/g, '_')
  const dir = direction.trim().toLowerCase().replace(/\s+/g, '_')
  return `${slug}__${dir}`
}

interface RouteEditorState {
  customRoutes: RouteFeature[]

  addRoute: (props: {
    route_num: string
    name: string
    route_type: RouteProperties['route_type']
    direction: string
  }) => string | null // returns route_key or null if duplicate
  editRoute: (routeKey: string, props: Partial<Pick<RouteProperties, 'name' | 'route_type' | 'direction' | 'route_num'>>) => void
  deleteRoute: (routeKey: string) => void
}

export const useRouteEditorStore = create<RouteEditorState>((set, get) => ({
  customRoutes: loadFromStorage(),

  addRoute: ({ route_num, name, route_type, direction }) => {
    const routeKey = buildRouteKey(route_num, direction)
    const { customRoutes } = get()
    if (customRoutes.some(r => r.properties.route_key === routeKey)) {
      return null // duplicate
    }
    const feature: RouteFeature = {
      type: 'Feature',
      properties: {
        route_key: routeKey,
        route_num: route_num.trim(),
        route_type,
        direction: direction.trim().toLowerCase().replace(/\s+/g, '_'),
        name: name.trim(),
        description: null,
        notes: null,
        peak_am: null,
        midday: null,
        peak_pm: null,
        night: null,
      },
      geometry: {
        type: 'LineString',
        coordinates: [],
      },
    }
    const updated = [...customRoutes, feature]
    persistToStorage(updated)
    set({ customRoutes: updated })
    return routeKey
  },

  editRoute: (routeKey, props) => {
    const { customRoutes } = get()
    const updated = customRoutes.map(r => {
      if (r.properties.route_key !== routeKey) return r
      const newProps = { ...r.properties }
      if (props.route_num !== undefined) newProps.route_num = props.route_num.trim()
      if (props.name !== undefined) newProps.name = props.name.trim()
      if (props.route_type !== undefined) newProps.route_type = props.route_type
      if (props.direction !== undefined) newProps.direction = props.direction.trim().toLowerCase().replace(/\s+/g, '_')
      // Recompute route_key if num or direction changed
      if (props.route_num !== undefined || props.direction !== undefined) {
        newProps.route_key = buildRouteKey(newProps.route_num, newProps.direction)
      }
      return { ...r, properties: newProps }
    })
    persistToStorage(updated)
    set({ customRoutes: updated })
  },

  deleteRoute: (routeKey) => {
    const { customRoutes } = get()
    const updated = customRoutes.filter(r => r.properties.route_key !== routeKey)
    persistToStorage(updated)
    set({ customRoutes: updated })
  },
}))
