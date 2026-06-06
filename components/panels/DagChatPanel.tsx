'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, Send, ChevronDown, ChevronUp, GitBranch, Check } from 'lucide-react'
import { resolveIcon } from '@/lib/icon-map'
import type { ChatMessage, DagSpec } from '@/lib/types'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys } from '@/lib/types'

interface Props {
  segment: string
  provider: Provider
  dagSpec: DagSpec
  history: ChatMessage[]
  keys: Partial<ApiKeys>
  product: string
  objective: string
  onSend: (userText: string, assistantMsg: ChatMessage) => void
  onAddNode: (msgIndex: number, additions: { nodes: DagSpec['nodes']; edges: DagSpec['edges'] }) => void
}

function NodePreviewCard({
  additions,
  added,
  onAdd,
}: {
  additions: { nodes: DagSpec['nodes']; edges: DagSpec['edges'] }
  added: boolean
  onAdd: () => void
}) {
  const node = additions.nodes[0]
  if (!node) return null
  const Icon = resolveIcon(node.iconName)

  return (
    <div
      style={{
        marginTop: 6,
        border: `0.5px solid ${added ? '#10B98140' : '#2A2A3E'}`,
        borderRadius: 8,
        background: added ? '#0D1F1A' : '#0F0F1A',
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {/* Icon + label */}
      <span style={{ color: node.color, flexShrink: 0 }}>
        <Icon size={13} />
      </span>
      <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: '#C4C4D4', lineHeight: 1.3 }}>
        {node.label}
      </span>

      {/* Add to graph button */}
      {added ? (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            color: '#10B981',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <Check size={11} /> Added
        </span>
      ) : (
        <button
          onClick={onAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: '#1E1A3A',
            border: '0.5px solid #534AB7',
            borderRadius: 6,
            padding: '3px 8px',
            fontSize: 10,
            fontWeight: 600,
            color: '#A89EE8',
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2D2650'
            e.currentTarget.style.color = '#C4BAF5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1E1A3A'
            e.currentTarget.style.color = '#A89EE8'
          }}
        >
          <GitBranch size={9} /> Add to graph
        </button>
      )}
    </div>
  )
}

export function DagChatPanel({
  segment, provider, dagSpec, history, keys, product, objective, onSend, onAddNode,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom whenever history changes or panel opens
  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, expanded])

  useEffect(() => {
    if (expanded) inputRef.current?.focus()
  }, [expanded])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          dagSpec,
          product,
          objective,
          segment,
          history: history.map((m) => ({ role: m.role, content: m.content })),
          provider,
          keys,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply,
        additions: data.additions,
        addedToGraph: false,
      }
      onSend(text, assistantMsg)
    } catch (err) {
      onSend(text, {
        role: 'assistant',
        content: err instanceof Error ? `Error: ${err.message}` : 'Something went wrong.',
      })
    } finally {
      setLoading(false)
    }
  }, [input, loading, dagSpec, product, objective, segment, history, provider, keys, onSend])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // Count assistant messages that have pending (not yet added) node suggestions
  const pendingCount = history.filter(
    (m) => m.role === 'assistant' && m.additions?.nodes.length && !m.addedToGraph
  ).length

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        background: 'rgba(13,13,20,0.97)',
        borderTop: '0.5px solid #1E1E2E',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'height 0.2s ease',
        height: expanded ? 220 : 36,
        overflow: 'hidden',
      }}
    >
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '0 14px',
          height: 36,
          flexShrink: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#5A5A6C',
          fontSize: 12,
          fontWeight: 500,
          width: '100%',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#9B9BAC')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#5A5A6C')}
      >
        <MessageCircle size={13} />
        <span>Refine analysis</span>

        {/* Badge: pending node suggestions */}
        {pendingCount > 0 && (
          <span
            style={{
              marginLeft: 4,
              background: '#534AB730',
              color: '#A89EE8',
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 99,
              padding: '1px 6px',
              border: '0.5px solid #534AB7',
            }}
          >
            {pendingCount} node{pendingCount > 1 ? 's' : ''} to add
          </span>
        )}

        <span style={{ marginLeft: 'auto' }}>
          {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </span>
      </button>

      {/* Message history */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 14px 4px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 0,
        }}
      >
        {history.length === 0 && (
          <p style={{ color: '#3A3A4C', fontSize: 11, margin: 0 }}>
            Ask a question — the answer will appear here with an option to add it as a graph node.
          </p>
        )}

        {history.map((msg, i) => (
          <div key={i}>
            {/* Message bubble */}
            <div
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  background: msg.role === 'user' ? '#1E1E2E' : 'transparent',
                  borderRadius: 8,
                  padding: msg.role === 'user' ? '6px 10px' : '2px 0',
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: msg.role === 'user' ? '#C4C4D4' : '#8A8A9C',
                }}
              >
                {msg.content}
              </div>
            </div>

            {/* Node preview card — only on assistant messages with suggestions */}
            {msg.role === 'assistant' && msg.additions?.nodes.length ? (
              <NodePreviewCard
                additions={msg.additions}
                added={!!msg.addedToGraph}
                onAdd={() => onAddNode(i, msg.additions!)}
              />
            ) : null}
          </div>
        ))}

        {loading && (
          <div style={{ color: '#3A3A4C', fontSize: 11 }}>
            <span className="animate-pulse">•••</span>
          </div>
        )}
      </div>

      {/* Input row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          padding: '6px 10px 8px',
          borderTop: '0.5px solid #1A1A28',
          flexShrink: 0,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this segment…"
          rows={1}
          style={{
            flex: 1,
            background: '#0F0F18',
            border: '0.5px solid #1E1E2E',
            borderRadius: 7,
            padding: '6px 10px',
            fontSize: 12,
            color: '#C4C4D4',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.4,
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? '#1A1A28' : '#534AB7',
            border: 'none',
            borderRadius: 7,
            padding: '7px 10px',
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            color: loading || !input.trim() ? '#3A3A4C' : '#fff',
            display: 'flex',
            alignItems: 'center',
            transition: 'background 0.15s',
            flexShrink: 0,
          }}
        >
          {loading
            ? <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-[#534AB7] border-t-white rounded-full" />
            : <Send size={13} />}
        </button>
      </div>
    </div>
  )
}
