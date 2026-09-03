'use client'

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { resolveIcon } from '@/lib/icon-map'
import type { DagSpec } from '@/lib/types'

interface Props {
  promptKey: string | null
  dagSpec: DagSpec | null
  content: string | null
  onClose: () => void
}

export function InsightPanel({ promptKey, dagSpec, content, onClose }: Props) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const nodeMeta = promptKey && dagSpec
    ? dagSpec.nodes.find((n) => n.id === promptKey) ?? null
    : null

  const Icon = nodeMeta ? resolveIcon(nodeMeta.iconName) : null

  return (
    <div
      style={{
        height: '100%',
        background: '#13131A',
        borderLeft: '0.5px solid #1E1E2E',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '0.5px solid #1E1E2E',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        {Icon && nodeMeta && (
          <span style={{ color: nodeMeta.color, flexShrink: 0 }}>
            <Icon size={18} />
          </span>
        )}
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#E6E6EC', letterSpacing: -0.2 }}>
          {nodeMeta?.label ?? '请选择节点'}
        </span>
        {promptKey && (
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-md transition-colors"
            style={{ width: 24, height: 24, background: 'transparent', border: 'none', color: '#5A5A6C', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#E6E6EC')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#5A5A6C')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Analysis focus */}
      {nodeMeta?.prompt && (
        <div style={{
          margin: '12px 20px 0',
          padding: '10px 12px',
          background: '#0D0D16',
          border: '0.5px solid #1E1E2E',
          borderRadius: 6,
          flexShrink: 0,
        }}>
          <div style={{ color: '#3A3A55', fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
            分析重点
          </div>
          <div style={{ color: '#62627A', fontSize: 11, lineHeight: 1.55 }}>
            {nodeMeta.prompt.replace(/^You are[^.]+\.\s*/i, '').replace(/^As an?[^,]+,\s*/i, '').trim().slice(0, 220)}
            {nodeMeta.prompt.length > 220 ? '…' : ''}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div className="px-5 pt-5 pb-12 prose prose-invert prose-sm max-w-none">
          {content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 style={{ color: '#E6E6EC', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ color: '#E6E6EC', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ color: '#E6E6EC', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{children}</h3>,
                p: ({ children }) => <p style={{ color: '#B0B0BC', fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>{children}</p>,
                ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 12, listStyleType: 'disc' }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ paddingLeft: 20, marginBottom: 12, listStyleType: 'decimal' }}>{children}</ol>,
                li: ({ children }) => <li style={{ color: '#B0B0BC', fontSize: 13, lineHeight: 1.7, marginBottom: 4, display: 'list-item' }}>{children}</li>,
                strong: ({ children }) => <strong style={{ color: '#E6E6EC', fontWeight: 600 }}>{children}</strong>,
                table: ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 12 }}>{children}</table>,
                th: ({ children }) => <th style={{ color: '#E6E6EC', fontWeight: 600, padding: '6px 10px', borderBottom: '1px solid #2A2A3A', textAlign: 'left' }}>{children}</th>,
                td: ({ children }) => <td style={{ color: '#B0B0BC', padding: '5px 10px', borderBottom: '0.5px solid #1E1E2E' }}>{children}</td>,
                blockquote: ({ children }) => <blockquote style={{ borderLeft: '2px solid #534AB7', paddingLeft: 12, marginLeft: 0, marginBottom: 12, color: '#8A8A9C', fontSize: 13 }}>{children}</blockquote>,
                hr: () => <hr style={{ border: 'none', borderTop: '0.5px solid #1E1E2E', margin: '16px 0' }} />,
                code: ({ children }) => (
                  <code style={{ background: '#1B1B25', border: '0.5px solid #1E1E2E', borderRadius: 4, padding: '1px 6px', fontSize: 12, color: '#8B5CF6', fontFamily: 'monospace' }}>
                    {children}
                  </code>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          ) : (
            <p style={{ color: '#5A5A6C', fontSize: 13 }}>
              {promptKey ? '加载中…' : '点击任一洞察节点查看详细分析。'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
