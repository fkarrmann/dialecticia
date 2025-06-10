import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  value: string
  onSelect?: (value: string, label: string) => void
}

const Select = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
  }
>(({ className, children, value, onValueChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || '')
  const [selectedLabel, setSelectedLabel] = React.useState('')
  
  // Update selectedValue when value prop changes
  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
      // Find the corresponding label from children
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          const childElement = child as React.ReactElement<SelectItemProps>
          if (childElement.props.value === value) {
            const label = typeof childElement.props.children === 'string' 
              ? childElement.props.children 
              : value
            setSelectedLabel(label)
          }
        }
      })
    }
  }, [value, children])

  const handleSelect = (newValue: string, label: string) => {
    setSelectedValue(newValue)
    setSelectedLabel(label)
    onValueChange?.(newValue)
    setIsOpen(false)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref && 'current' in ref && ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, ref])

  return (
    <div ref={ref} className="relative" {...props}>
      <button
        type="button"
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-400 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          className
        )}
        onClick={handleToggle}
      >
        <span className="text-white">
          {selectedLabel || selectedValue || "Seleccionar..."}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-600 bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === SelectItem) {
              const childElement = child as React.ReactElement<SelectItemProps>
              return React.cloneElement(childElement, { 
                onSelect: handleSelect,
                key: childElement.props.value 
              })
            }
            return child
          })}
        </div>
      )}
    </div>
  )
})
Select.displayName = "Select"

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex h-12 w-full items-center justify-between rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white ring-offset-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </button>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    placeholder?: string
  }
>(({ className, placeholder, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("block truncate text-white", className)}
    {...props}
  >
    {placeholder}
  </span>
))
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border border-slate-600 bg-slate-800 text-white shadow-md",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
  HTMLDivElement,
  SelectItemProps
>(({ className, children, value, onSelect, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onSelect) {
      const label = typeof children === 'string' ? children : value
      onSelect(value, label)
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-md py-3 px-4 text-sm outline-none hover:bg-slate-700 focus:bg-slate-700 text-white transition-colors",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
})
SelectItem.displayName = "SelectItem"

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} 