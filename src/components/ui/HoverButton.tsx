import React from 'react'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string
}

const HoverButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ text = 'Button', className, ...props }, ref) => (
    <button
      ref={ref}
      className={`group relative cursor-pointer overflow-hidden rounded-full border bg-background px-6 py-2 text-center font-semibold ${className || ''}`}
      {...props}
    >
      <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">{text}</span>
      <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[#D4875E] text-white opacity-0 transition-all duration-300 group-hover:opacity-100 rounded-full">
        <span>{text}</span>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
      </div>
    </button>
  ),
)

HoverButton.displayName = 'HoverButton'
export default HoverButton
