'use client'

import { useState } from 'react'
import { X, GitCompare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { tokens } from '@/lib/tokens'
import type { Provider } from '@/lib/langgraph/providers'
import type { DagSpec, SegmentSession } from '@/lib/types'

const PROVIDER_LABELS: Record<Provider, string> = {
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  claude: 'Claude',
  groq: 'Groq',
}

interface Props {
  segment: string
  primaryProvider: Provider
  availableProviders: Provider[]
  getSession: (segment: string, provider: Provider) => SegmentSession
  dagSpec: DagSpec
  selectedNode: string | null
  onClose: () => void
}

function InsightColumn({
  session,
  provider,
  nodeId,
  dagSpec,
}: {
  session: SegmentSession
  provider: Provider
  nodeId: string | null
  dagSpec: DagSpec
}) {
  const color = tokens.providers[provider as keyof typeof tokens.providers] ?? '#7A7A8C'
  const content = nodeId ? session.insights?.[nodeId] ?? null : null
  const nodeLabel = nodeId ? dagSpec.nodes.find((n) => n.id === nodeId)?.label : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid #1E1E2E', background: `${color}08` }}
      >
        <span
          className="inline-block rounded-full flex-shrink-0"
          style={{ width: 7, height: 7, background: color }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {PROVIDER_LABELS[provider]}
        </span>
        {nodeLabel && (
          <span style={{ fontSize: 11, color: '#5A5A6C', marginLeft: 4 }}>· {nodeLabel}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {content ? (
          <div
            className="prose prose-invert prose-sm max-w-none"
            style={{ color: '#C0C0CC', fontSize: 12.5, lineHeight: 1.75 }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <p style={{ color: '#3A3A4C', fontSize: 12, marginTop: 8 }}>
            {nodeId ? 'No content for this node.' : 'Click a node in the DAG to compare.'}
          </p>
        )}
      </div>
    </div>
  )
}

export function ComparePanel({
  segment,
  primaryProvider,
  availableProviders,
  getSession,
  dagSpec,
  selectedNode,
  onClose,
}: Props) {
  const others = availableProviders.filter((p) => p !== primaryProvider)
  const [compareProvider, setCompareProvider] = useState<Provider>(others[0] ?? primaryProvider)

  const primarySession = getSession(segment, primaryProvider)
  const compareSession = getSession(segment, compareProvider)

  return (
    <div className="h-full flex flex-col" style={{ background: '#0D0D14' }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{ height: 44, borderBottom: '1px solid #1E1E2E' }}
      >
        <div className="flex items-center gap-2">
          <GitCompare size={13} style={{ color: '#534AB7' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#D0D0DC' }}>Compare providers</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Right-side provider picker */}
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 11, color: '#5A5A6C' }}>vs</span>
            <select
              value={compareProvider}
              onChange={(e) => setCompareProvider(e.target.value as Provider)}
              style={{
                background: '#13131A',
                border: '1px solid #252535',
                color: '#C0C0CC',
                fontSize: 11,
                borderRadius: 6,
                padding: '3px 8px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {others.map((p) => (
                <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
              ))}
            </select>
          </div>

          <button
            onClick={onClose}
            title="Close compare"
            className="flex items-center justify-center rounded-md transition-colors"
            style={{ width: 26, height: 26, color: '#6B6B80', background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#C0C0CC')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6B6B80')}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden" style={{ borderRight: '1px solid #1E1E2E' }}>
          <InsightColumn
            session={primarySession}
            provider={primaryProvider}
            nodeId={selectedNode}
            dagSpec={dagSpec}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <InsightColumn
            session={compareSession}
            provider={compareProvider}
            nodeId={selectedNode}
            dagSpec={dagSpec}
          />
        </div>
      </div>
    </div>
  )
}
