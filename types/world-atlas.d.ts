declare module 'world-atlas/countries-110m.json' {
  const data: Record<string, unknown>
  export = data
}

declare module 'react-simple-maps' {
  import type { ReactNode, CSSProperties } from 'react'

  interface ComposableMapProps {
    projection?: string
    projectionConfig?: Record<string, unknown>
    style?: CSSProperties
    children?: ReactNode
  }
  export function ComposableMap(props: ComposableMapProps): JSX.Element

  interface GeographiesProps {
    geography: string | Record<string, unknown>
    children: (props: { geographies: GeoFeature[] }) => ReactNode
  }
  interface GeoFeature {
    rsmKey: string
    [key: string]: unknown
  }
  export function Geographies(props: GeographiesProps): JSX.Element

  interface GeographyProps {
    geography: GeoFeature
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: { default?: CSSProperties; hover?: CSSProperties; pressed?: CSSProperties }
  }
  export function Geography(props: GeographyProps): JSX.Element

  interface MarkerProps {
    coordinates: [number, number]
    children?: ReactNode
  }
  export function Marker(props: MarkerProps): JSX.Element

  interface ZoomableGroupProps {
    zoom?: number
    center?: [number, number]
    minZoom?: number
    maxZoom?: number
    onMoveStart?: (position: { coordinates: [number, number]; zoom: number }) => void
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void
    children?: ReactNode
  }
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element
}
