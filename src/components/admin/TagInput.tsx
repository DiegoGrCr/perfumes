'use client'
import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  isNumber?: boolean
}

export function TagInput({ label, values, onChange, placeholder = 'Escribe y presiona Enter', isNumber = false }: TagInputProps) {
  const [input, setInput] = useState('')

  function addTag() {
    const val = input.trim()
    if (!val) return
    if (isNumber) {
      const num = parseInt(val, 10)
      if (isNaN(num)) return
      const strNum = String(num)
      if (!values.includes(strNum)) onChange([...values, strNum])
    } else {
      if (!values.includes(val)) onChange([...values, val])
    }
    setInput('')
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && input === '' && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  function removeTag(idx: number) {
    onChange(values.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-widest" style={{ color: '#C9A84C' }}>
        {label}
      </label>
      <div
        className="flex flex-wrap gap-1.5 p-2 rounded min-h-[42px] cursor-text"
        style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}
        onClick={() => document.getElementById(`tag-input-${label}`)?.focus()}
      >
        {values.map((v, i) => (
          <span
            key={i}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
            style={{ background: '#1a1a1a', color: '#C9A84C', border: '1px solid #2a2a2a' }}
          >
            {v}
            <button type="button" onClick={() => removeTag(i)} className="hover:text-white transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          id={`tag-input-${label}`}
          type={isNumber ? 'number' : 'text'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={addTag}
          placeholder={values.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
          style={{ color: '#F5F0E8' }}
        />
      </div>
    </div>
  )
}
