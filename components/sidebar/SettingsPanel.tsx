'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { saveKeys, loadKeys, clearKeys } from '@/lib/settings/keys'
import type { ApiKeys } from '@/lib/types'

const PROVIDERS = [
  { id: 'anthropic' as const,  label: 'Anthropic (Claude)',  placeholder: 'sk-ant-...' },
  { id: 'openai' as const,     label: 'OpenAI',              placeholder: 'sk-...' },
  { id: 'groq' as const,       label: 'Groq',                placeholder: 'gsk_...' },
  { id: 'openrouter' as const, label: 'OpenRouter',          placeholder: 'sk-or-...' },
]

export function SettingsPanel() {
  const [keys, setKeys] = useState<Partial<ApiKeys>>(loadKeys)

  function handleSave() {
    saveKeys(keys)
  }

  function handleClear() {
    clearKeys()
    setKeys({})
  }

  return (
    <Sheet>
      <SheetTrigger
        title="Settings"
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#7A7A8C] hover:text-[#E6E6EC] hover:bg-white/5 transition-colors"
      >
        <Settings size={14} />
      </SheetTrigger>
      <SheetContent className="bg-[#13131A] border-[#1E1E2E] text-[#E6E6EC]">
        <SheetHeader>
          <SheetTitle className="text-[#E6E6EC]">Settings</SheetTitle>
          <SheetDescription className="text-[#7A7A8C]">
            Keys are stored in your browser only. Never sent to any server except
            the provider you select.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-5">
          {PROVIDERS.map((p) => {
            const hasKey = !!keys[p.id]
            return (
              <div key={p.id} className="flex flex-col gap-1.5">
                <Label htmlFor={p.id} className="text-sm text-[#E6E6EC]">
                  {p.label}
                </Label>
                <Input
                  id={p.id}
                  type="password"
                  placeholder={p.placeholder}
                  value={keys[p.id] ?? ''}
                  onChange={(e) =>
                    setKeys((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  className="bg-[#0A0A0F] border-[#1E1E2E] text-[#E6E6EC] placeholder:text-[#5A5A6C]"
                />
                <span
                  className={`text-xs font-medium ${hasKey ? 'text-[#10B981]' : 'text-[#5A5A6C]'}`}
                >
                  {hasKey ? '✓ Connected' : '✗ Not set'}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            onClick={handleSave}
            className="bg-[#534AB7] hover:bg-[#6B62D1] text-white border-none"
          >
            Save
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            className="border-[#1E1E2E] text-[#7A7A8C] hover:text-[#E6E6EC] bg-transparent"
          >
            Clear all
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
