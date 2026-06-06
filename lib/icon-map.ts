import {
  Target,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Shield,
  Crosshair,
  User,
  BarChart2,
  Share2,
  Zap,
  Globe,
  DollarSign,
  Clock,
  Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ICON_MAP: Record<string, LucideIcon> = {
  Target,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Shield,
  Crosshair,
  User,
  BarChart2,
  Share2,
  Zap,
  Globe,
  DollarSign,
  Clock,
  Star,
}

export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? BarChart2
}
