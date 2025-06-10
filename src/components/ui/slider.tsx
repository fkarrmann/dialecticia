import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  max?: number
  min?: number
  step?: number
  className?: string
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, onValueChange, max = 100, min = 0, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value)
      onValueChange([newValue])
    }

    return (
      <div ref={ref} className={cn("relative flex w-full touch-none select-none items-center", className)} {...props}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0] || 0}
          onChange={handleChange}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-600 slider-thumb:appearance-none slider-thumb:h-5 slider-thumb:w-5 slider-thumb:rounded-full slider-thumb:bg-purple-500 slider-thumb:cursor-pointer"
          style={{
            background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((value[0] - min) / (max - min)) * 100}%, #475569 ${((value[0] - min) / (max - min)) * 100}%, #475569 100%)`
          }}
        />
      </div>
    )
  }
)

Slider.displayName = "Slider"

export { Slider } 