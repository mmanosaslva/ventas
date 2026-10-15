'use client'

import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { EyeIcon, EyeOffIcon, LockIcon, SearchIcon, type IconProps } from './icons'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: (props: IconProps) => JSX.Element
}

// Input con icono a la izquierda; mantiene las clases de la plataforma
export function Field({ icon: Icon, className = '', ...props }: FieldProps) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
      )}
      <input className={`input-field ${Icon ? '!pl-11' : ''} ${className}`} {...props} />
    </div>
  )
}

// Contraseña con botón para mostrar/ocultar
export function PasswordField({ className = '', ...props }: Omit<FieldProps, 'type' | 'icon'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
      <input
        type={visible ? 'text' : 'password'}
        className={`input-field !pl-11 !pr-12 ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-3 text-ink/40 hover:text-ink transition-colors"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}

// Input de dinero: prefijo $ en mono, igual que el resto de la plataforma
export function MoneyField({ className = '', ...props }: Omit<FieldProps, 'type' | 'icon'>) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 font-mono pointer-events-none">$</span>
      <input
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        className={`input-field !pl-8 font-mono ${className}`}
        {...props}
      />
    </div>
  )
}

export function SearchField({ className = '', ...props }: Omit<FieldProps, 'type' | 'icon'>) {
  return (
    <Field
      type="search"
      icon={SearchIcon}
      className={className}
      {...props}
    />
  )
}
