import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }) {
  const variants = {
    default: 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]',
    success: 'bg-[var(--color-success-dim)] text-[var(--color-success)] border-[var(--color-success)]/30',
    warning: 'bg-[var(--color-warning-dim)] text-[var(--color-warning)] border-[var(--color-warning)]/30',
    error: 'bg-[var(--color-error-dim)] text-[var(--color-error)] border-[var(--color-error)]/30',
    info: 'bg-[var(--color-primary-dim)] text-[var(--color-primary)] border-[var(--color-primary)]/30',
  };
  return <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border', variants[variant])}>{children}</span>;
}

export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { ready: 'bg-[var(--color-success)]', building: 'bg-[var(--color-primary)] animate-pulse-glow', queued: 'bg-[var(--color-warning)]', error: 'bg-[var(--color-error)]', canceled: 'bg-[var(--color-text-dim)]' };
  return <span className={cn('inline-block w-2 h-2 rounded-full', colors[status] || 'bg-[var(--color-text-dim)]')} />;
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className, type = 'button' }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; disabled?: boolean; className?: string; type?: 'button' | 'submit' }) {
  const variants = {
    primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white border border-[var(--color-primary)] hover:border-[var(--color-primary-hover)]',
    secondary: 'bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] text-[var(--color-text)] border border-[var(--color-border)]',
    ghost: 'hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-transparent',
    danger: 'bg-[var(--color-error-dim)] hover:bg-[var(--color-error)]/20 text-[var(--color-error)] border border-[var(--color-error)]/30',
  };
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  return <button type={type} onClick={onClick} disabled={disabled} className={cn('inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)}>{children}</button>;
}

export function Input({ value, onChange, placeholder, type = 'text', className, onKeyDown }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string; onKeyDown?: (e: React.KeyboardEvent) => void }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown} className={cn('w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-colors', className)} />;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('bg-[var(--color-surface)]/50 border border-[var(--color-border)] rounded-xl', className)}>{children}</div>;
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center py-16 px-4 text-center"><div className="w-12 h-12 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-dim)] mb-4">{icon}</div><h3 className="text-[var(--color-text)] font-medium text-sm mb-1">{title}</h3><p className="text-[var(--color-text-dim)] text-xs max-w-sm mb-4">{description}</p>{action}</div>;
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>;
}
