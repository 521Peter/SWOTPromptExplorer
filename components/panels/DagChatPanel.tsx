'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, Send, GitBranch, Check } from 'lucide-react'
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
      {/* 图标和标签 */}
      <span style={{ color: node.color, flexShrink: 0 }}>
        <Icon size={13} />
      </span>
      <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: '#C4C4D4', lineHeight: 1.3 }}>
        {node.label}
      </span>

      {/* 添加到图谱按钮 */}
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
          <Check size={11} /> 已添加
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
          <GitBranch size={9} /> 添加到图谱
        </button>
      )}
    </div>
  )
}

export function DagChatPanel({
  segment, provider, dagSpec, history, keys, product, objective, onSend, onAddNode,
}: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [history])

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
        content: err instanceof Error ? `错误：${err.message}` : '发生了未知错误。',
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

  const pendingCount = history.filter(
    (m) => m.role === 'assistant' && m.additions?.nodes.length && !m.addedToGraph
  ).length

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: '#0D0D14', borderTop: '0.5px solid #1E1E2E' }}
    >
      {/* 页头 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '0 14px',
          height: 36,
          flexShrink: 0,
          borderBottom: '0.5px solid #1A1A28',
          color: '#5A5A6C',
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        <MessageCircle size={13} />
        <span>深入分析</span>
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
            {pendingCount} 个节点待添加
          </span>
        )}
      </div>

      {/* 消息历史 */}
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
            输入问题后，回答会显示在这里，并可作为新节点添加到分析图谱。
          </p>
        )}

        {history.map((msg, i) => (
          <div key={i}>
            {/* 消息气泡 */}
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

            {/* 节点预览卡片，仅用于包含建议的助手消息 */}
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

      {/* 输入行 */}
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
          placeholder="继续询问这个客户群体…"
          rows={1}
          style={{
            flex: 1,
            background: '#0F0F18',
            border: '0.5px solid #1E1E2E',
            borderRadius: 7,
            padding: '6px 10px',
            fontSize: 12,
            color: '#E8E8F0',
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
