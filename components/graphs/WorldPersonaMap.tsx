'use client'

import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { motion } from 'framer-motion'
import { Plus, Minus, Minimize2, X } from 'lucide-react'
import geoData from 'world-atlas/countries-110m.json'
import type { RegionResult } from '@/hooks/usePersona'

const MIN_R = 20
const MAX_R = 40
const DEFAULT_CENTER: [number, number] = [10, 10]
const DEFAULT_ZOOM = 1

function ringRadius(pct: number): number {
  return MIN_R + (pct / 100) * (MAX_R - MIN_R)
}

interface Props {
  regions: RegionResult[]
  onAddRegion: (name: string) => void
  onRegionClick: (region: RegionResult) => void
  selectedRegionId: string | null
}

export function WorldPersonaMap({ regions, onAddRegion, onRegionClick, selectedRegionId }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [addInput, setAddInput] = useState('')

  function handleAdd() {
    const t = addInput.trim()
    if (t) { onAddRegion(t); setAddInput('') }
  }

  const isZoomed = zoom > 1.2

  function zoomToRegion(region: RegionResult) {
    setCenter(region.coordinates as [number, number])
    setZoom(5)
    onRegionClick(region)
  }

  function resetZoom() {
    setCenter(DEFAULT_CENTER)
    setZoom(DEFAULT_ZOOM)
  }

  return (
    <div style={{ background: '#06060C', height: '100%', overflow: 'hidden', position: 'relative' }}>

      {/* Zoom controls — match ReactFlow Controls default white style */}
      <div style={{
        position: 'absolute', bottom: 15, left: 15, zIndex: 10,
        display: 'flex', flexDirection: 'column',
        borderRadius: 8, overflow: 'hidden',
        border: '1px solid #e2e2e2',
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        background: '#fff',
      }}>
        {[
          { icon: <Plus size={12} />, title: 'Zoom in',   onClick: () => setZoom((z) => Math.min(12, +parseFloat((z * 1.6).toFixed(2)))) },
          { icon: <Minus size={12} />, title: 'Zoom out', onClick: () => setZoom((z) => Math.max(1, +parseFloat((z / 1.6).toFixed(2)))) },
          ...(isZoomed ? [{ icon: <Minimize2 size={12} />, title: 'Reset view', onClick: resetZoom }] : []),
        ].map(({ icon, title, onClick }, idx) => (
          <button
            key={title}
            onClick={onClick}
            title={title}
            style={{
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#fff', cursor: 'pointer',
              color: '#333', transition: 'background 0.15s',
              border: 'none',
              borderTop: idx > 0 ? '1px solid #e2e2e2' : 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f4f4f4' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
          >
            {icon}
          </button>
        ))}
      </div>

      <ComposableMap
        style={{ width: '100%', height: '100%' }}
        projectionConfig={{ scale: 130, center: DEFAULT_CENTER }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          minZoom={1}
          maxZoom={12}
          onMoveEnd={({ zoom: z, coordinates }) => {
            setZoom(z)
            setCenter(coordinates as [number, number])
          }}
        >
          <Geographies geography={geoData as unknown as string}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey} geography={geo}
                  fill="#1C1C2E" stroke="#3A3A58" strokeWidth={0.7}
                  style={{ default: { outline: 'none' }, hover: { outline: 'none', fill: '#1E1E32' }, pressed: { outline: 'none' } }}
                />
              ))
            }
          </Geographies>

          {regions.map((region, i) => {
            if (region.status === 'loading' && region.coordinates[0] === 0 && region.coordinates[1] === 0) return null
            const isHov = hovered === region.id
            const isSel = selectedRegionId === region.id
            const isLoad = region.status === 'loading'
            // Scale marker inversely with zoom so rings stay constant screen size
            const markerScale = 1 / Math.max(1, zoom * 0.8)
            const r = isLoad ? MIN_R : ringRadius(region.pct)
            const circ = 2 * Math.PI * r
            const arc = (region.pct / 100) * circ
            const strokeW = isSel || isHov ? 4 : 3

            return (
              <Marker key={region.id} coordinates={region.coordinates}>
                <motion.g
                  key={`${region.id}-${region.status}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: markerScale, opacity: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.38, type: 'spring', stiffness: 220, damping: 18 }}
                  onMouseEnter={() => setHovered(region.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => { if (region.status === 'ready') zoomToRegion(region) }}
                  style={{ cursor: region.status === 'ready' ? 'pointer' : 'default' }}
                >
                  {isLoad ? (
                    <>
                      <circle cx={0} cy={0} r={MIN_R} fill="none" stroke={region.color} strokeWidth={2.5} strokeOpacity={0.15} />
                      <motion.g
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                        style={{ transformOrigin: '0px 0px' }}
                      >
                        <circle
                          cx={0} cy={0} r={MIN_R} fill="none"
                          stroke={region.color} strokeWidth={2.5} strokeLinecap="round"
                          strokeDasharray={`${circ * 0.28} ${circ * 0.72}`}
                        />
                      </motion.g>
                    </>
                  ) : (
                    <>
                      {(isHov || isSel) && (
                        <circle cx={0} cy={0} r={r + 6} fill="none" stroke={region.color} strokeWidth={1} strokeOpacity={0.25} />
                      )}
                      <circle cx={0} cy={0} r={r} fill="none" stroke={region.color} strokeWidth={strokeW} strokeOpacity={0.18} />
                      <circle
                        cx={0} cy={0} r={r}
                        fill="none" stroke={region.color} strokeWidth={strokeW}
                        strokeDasharray={circ} strokeDashoffset={circ - arc}
                        strokeLinecap="round" transform="rotate(-90)"
                        strokeOpacity={isSel || isHov ? 1 : 0.88}
                      />
                      <circle cx={0} cy={0} r={r - strokeW - 1} fill={region.color} fillOpacity={isSel ? 0.16 : isHov ? 0.09 : 0.05} />
                      <text
                        textAnchor="middle" y={r > 28 ? -4 : -2}
                        style={{ fill: region.color, fontSize: Math.max(9, r * 0.44), fontWeight: 700, fontFamily: 'var(--font-mono)', pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {region.pct}%
                      </text>
                      {r > 24 && (
                        <text
                          textAnchor="middle" y={r * 0.38}
                          style={{ fill: region.color, fillOpacity: 0.75, fontSize: Math.max(7, r * 0.28), fontFamily: 'var(--font-mono)', pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {region.name.split(' ')[0]}
                        </text>
                      )}
                      {isHov && !isSel && (
                        <g transform={`translate(0, ${-r - 18})`}>
                          <rect x={-62} y={-12} width={124} height={19} rx={3} fill="#13131A" stroke={region.color} strokeWidth={0.7} strokeOpacity={0.5} />
                          <text textAnchor="middle" dominantBaseline="central"
                            style={{ fill: '#AAA', fontSize: 8, fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}
                          >
                            {region.name} · click to zoom
                          </text>
                        </g>
                      )}
                    </>
                  )}
                </motion.g>
              </Marker>
            )
          })}
        </ZoomableGroup>
      </ComposableMap>
      {/* Bottom strip — add custom region */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'rgba(6,6,12,0.82)', borderTop: '1px solid #1A1A28',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '5px 10px 5px 12px',
      }}>
        <Plus size={9} style={{ color: '#2E2E42', flexShrink: 0 }} />
        <input
          value={addInput}
          onChange={(e) => setAddInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          placeholder="Analyze a region…  e.g. ANZ, Gulf States, Nordic"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: '#D0D0E8', fontSize: 10, fontFamily: 'var(--font-mono)',
          }}
        />
        {addInput.trim() && (
          <>
            <button
              onClick={handleAdd}
              style={{
                background: 'rgba(83,74,183,0.15)', border: '1px solid #534AB7',
                borderRadius: 4, color: '#9D94F0', fontSize: 10,
                fontFamily: 'var(--font-mono)', cursor: 'pointer',
                padding: '2px 8px', transition: 'all 0.15s', flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(83,74,183,0.28)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(83,74,183,0.15)' }}
            >
              Analyze →
            </button>
            <button
              onClick={() => setAddInput('')}
              style={{ color: '#333', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#888')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#333')}
            >
              <X size={10} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

