'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { CheckIcon, ChevronDownIcon, type IconProps } from './icons'

export interface SelectOption {
  value: string
  label: string
  hint?: string
  group?: string
  disabled?: boolean
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  icon?: (props: IconProps) => JSX.Element
  ariaLabel?: string
  className?: string
}

// Desplegable propio: el <select> nativo no permite aplicar la tipografía ni los colores de la plataforma
export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Selecciona',
  icon: Icon,
  ariaLabel,
  className = ''
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setActive(Math.max(0, options.findIndex(o => o.value === value)))
    }
  }, [open, options, value])

  useEffect(() => {
    if (open && active >= 0) {
      document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' })
    }
  }, [open, active, listId])

  const choose = (v: string) => {
    if (options.find(o => o.value === v)?.disabled) return
    onChange(v)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return setOpen(true)
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive(i => (i + step + options.length) % options.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!open) setOpen(true)
      else if (active >= 0) choose(options[active].value)
    }
  }

  let lastGroup: string | undefined

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKeyDown}
        className={`input-field flex items-center gap-2 text-left ${Icon ? '!pl-11' : ''}`}
      >
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />}
        <span className={`flex-1 truncate ${selected ? 'text-ink' : 'text-ink/30'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon
          width={18}
          height={18}
          className={`shrink-0 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-30 max-h-64 overflow-y-auto bg-paper border border-ledger rounded-lg shadow-lg py-1"
        >
          {options.map((o, i) => {
            const showGroup = o.group !== undefined && o.group !== lastGroup
            lastGroup = o.group
            return (
              <li key={o.value} role="presentation">
                {showGroup && (
                  <p className="table-header px-4 pt-3 pb-1">{o.group}</p>
                )}
                <div
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o.value)}
                  aria-disabled={o.disabled}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                    o.disabled ? 'cursor-not-allowed text-ink/30' : 'cursor-pointer'
                  } ${i === active && !o.disabled ? 'bg-ledger/60' : ''} ${
                    o.value === value ? 'text-copper font-medium' : o.disabled ? '' : 'text-ink/80'
                  }`}
                >
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="font-mono text-xs text-ink/40">{o.hint}</span>}
                  {o.value === value && <CheckIcon width={16} height={16} />}
                </div>
              </li>
            )
          })}
          {options.length === 0 && (
            <li className="px-4 py-3 text-sm text-ink/30">Sin opciones</li>
          )}
        </ul>
      )}
    </div>
  )
}
