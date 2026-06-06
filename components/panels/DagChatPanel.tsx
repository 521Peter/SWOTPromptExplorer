'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, Send, ChevronDown, ChevronUp, Plus } from 'lucide-react'
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
  onMessage: (userMsg: string, assistantMsg: ChatMessage, additions?: { nodes: DagSpec['nodes']; edges: DagSpec['edges'] }) => void
}

export function DagChatPanel({ segment, provider, dagSpec, history, keys, product, objective, onMessage }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
          history,
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
      }
      onMessage(text, assistantMsg, data.additions)
    } catch (err) {
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: err instanceof Error ? `Error: ${err.message}` : 'Something went wrong.',
      }
      onMessage(text, assistantMsg)
    } finally {
      setLoading(false)
    }
  }, [input, loading, dagSpec, product, objective, segment, history, provider, keys, onMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

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
        height: expanded ? 200 : 36,
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
        {history.length > 0 && (
          <span
            style={{
              marginLeft: 4,
              background: '#534AB7',
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 99,
              padding: '1px 6px',
            }}
          >
            {history.length}
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
          gap: 8,
          minHeight: 0,
        }}
      >
        {history.length === 0 && (
          <p style={{ color: '#3A3A4C', fontSize: 11, margin: 0 }}>
            Ask the LLM to add a new analysis node, or ask a question about the current results.
          </p>
        )}
        {history.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                background: msg.role === 'user' ? '#1E1E2E' : 'transparent',
                borderRadius: 8,
                padding: msg.role === 'user' ? '6px 10px' : '2px 0',
                fontSize: 12,
                lineHeight: 1.5,
                color: msg.role === 'user' ? '#C4C4D4' : '#8A8A9C',
              }}
            >
              {msg.content}
              {msg.additions && msg.additions.nodes.length > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginLeft: 8,
                    background: '#10B98120',
                    color: '#10B981',
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: 99,
                    padding: '1px 7px',
                  }}
                >
                  <Plus size={9} />
                  {msg.additions.nodes.length} node{msg.additions.nodes.length > 1 ? 's' : ''} added
                </span>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <span style={{ color: '#3A3A4C', fontSize: 11 }}>
              <span className="animate-pulse">•••</span>
            </span>
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
          placeholder="Add a node, ask a question…"
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
