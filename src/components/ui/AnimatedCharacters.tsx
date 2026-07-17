'use client'

import { useState, useEffect, useRef } from 'react'

function Pupil({ size = 12, maxDistance = 5, pupilColor = 'black', forceLookX, forceLookY }: {
  size?: number; maxDistance?: number; pupilColor?: string; forceLookX?: number; forceLookY?: number
}) {
  const [mx, setMx] = useState(0); const [my, setMy] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { setMx(e.clientX); setMy(e.clientY) }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const pos = (() => {
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY }
    if (!ref.current) return { x: 0, y: 0 }
    const r = ref.current.getBoundingClientRect()
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    const dx = mx - cx, dy = my - cy
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance)
    const angle = Math.atan2(dy, dx)
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
  })()

  return <div ref={ref} className="rounded-full" style={{ width: size, height: size, backgroundColor: pupilColor, transform: `translate(${pos.x}px,${pos.y}px)`, transition: 'transform 0.1s ease-out' }} />
}

function EyeBall({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = 'white', pupilColor = 'black', isBlinking = false, forceLookX, forceLookY }: {
  size?: number; pupilSize?: number; maxDistance?: number; eyeColor?: string; pupilColor?: string; isBlinking?: boolean; forceLookX?: number; forceLookY?: number
}) {
  const [mx, setMx] = useState(0); const [my, setMy] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { setMx(e.clientX); setMy(e.clientY) }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const pos = (() => {
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY }
    if (!ref.current) return { x: 0, y: 0 }
    const r = ref.current.getBoundingClientRect()
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    const dx = mx - cx, dy = my - cy
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance)
    const angle = Math.atan2(dy, dx)
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
  })()

  return (
    <div ref={ref} className="rounded-full flex items-center justify-center" style={{
      width: size, height: isBlinking ? 2 : size, backgroundColor: eyeColor, overflow: 'hidden', transition: 'all 0.15s',
    }}>
      {!isBlinking && <div className="rounded-full" style={{
        width: pupilSize, height: pupilSize, backgroundColor: pupilColor,
        transform: `translate(${pos.x}px,${pos.y}px)`, transition: 'transform 0.1s ease-out'
      }} />}
    </div>
  )
}

export default function AnimatedCharacters({ isTyping = false, showPassword = false, passwordLength = 0 }) {
  const [mx, setMx] = useState(0); const [my, setMy] = useState(0)
  const [purpleBlink, setPurpleBlink] = useState(false)
  const [blackBlink, setBlackBlink] = useState(false)
  const [lookingEachOther, setLookingEachOther] = useState(false)
  const [purplePeek, setPurplePeek] = useState(false)
  const purpleRef = useRef<HTMLDivElement>(null)
  const blackRef = useRef<HTMLDivElement>(null)
  const yellowRef = useRef<HTMLDivElement>(null)
  const orangeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { setMx(e.clientX); setMy(e.clientY) }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Random blinking
  useEffect(() => {
    const blink = () => {
      setPurpleBlink(true); setTimeout(() => { setPurpleBlink(false); schedule() }, 150)
    }
    const schedule = () => setTimeout(blink, Math.random() * 4000 + 3000)
    const t = schedule(); return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    const blink = () => {
      setBlackBlink(true); setTimeout(() => { setBlackBlink(false); schedule() }, 150)
    }
    const schedule = () => setTimeout(blink, Math.random() * 4000 + 3000)
    const t = schedule(); return () => clearTimeout(t)
  }, [])

  // Typing reaction
  useEffect(() => {
    if (isTyping) { setLookingEachOther(true); const t = setTimeout(() => setLookingEachOther(false), 800); return () => clearTimeout(t) }
    else setLookingEachOther(false)
  }, [isTyping])

  // Password peeking
  useEffect(() => {
    if (passwordLength > 0 && showPassword) {
      const t = setTimeout(() => {
        setPurplePeek(true); setTimeout(() => setPurplePeek(false), 800)
      }, Math.random() * 3000 + 2000)
      return () => clearTimeout(t)
    } else setPurplePeek(false)
  }, [passwordLength, showPassword])

  const calcPos = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 }
    const r = ref.current.getBoundingClientRect()
    const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 3)
    return { faceX: Math.max(-15, Math.min(15, dx / 20)), faceY: Math.max(-10, Math.min(10, dy / 30)), bodySkew: Math.max(-6, Math.min(6, -dx / 120)) }
  }

  const pp = calcPos(purpleRef), bp = calcPos(blackRef), yp = calcPos(yellowRef), op = calcPos(orangeRef)
  const hidingPassword = passwordLength > 0 && !showPassword

  return (
    <div className="relative" style={{ width: 550, height: 400 }}>
      {/* Purple - back layer */}
      <div ref={purpleRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{
        left: 70, width: 180, height: (isTyping || hidingPassword) ? 440 : 400,
        backgroundColor: '#6C3FF5', borderRadius: '10px 10px 0 0', zIndex: 1,
        transform: (passwordLength > 0 && showPassword) ? 'skewX(0deg)' : (isTyping || hidingPassword) ? `skewX(${(pp.bodySkew || 0) - 12}deg) translateX(40px)` : `skewX(${pp.bodySkew || 0}deg)`,
        transformOrigin: 'bottom center',
      }}>
        <div className="absolute flex gap-8 transition-all duration-700" style={{
          left: (passwordLength > 0 && showPassword) ? 20 : lookingEachOther ? 55 : 45 + (pp.faceX || 0),
          top: (passwordLength > 0 && showPassword) ? 35 : lookingEachOther ? 65 : 40 + (pp.faceY || 0),
        }}>
          <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={purpleBlink}
            forceLookX={(passwordLength > 0 && showPassword) ? (purplePeek ? 4 : -4) : lookingEachOther ? 3 : undefined}
            forceLookY={(passwordLength > 0 && showPassword) ? (purplePeek ? 5 : -4) : lookingEachOther ? 4 : undefined} />
          <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={purpleBlink}
            forceLookX={(passwordLength > 0 && showPassword) ? (purplePeek ? 4 : -4) : lookingEachOther ? 3 : undefined}
            forceLookY={(passwordLength > 0 && showPassword) ? (purplePeek ? 5 : -4) : lookingEachOther ? 4 : undefined} />
        </div>
      </div>

      {/* Black - middle layer */}
      <div ref={blackRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{
        left: 240, width: 120, height: 310, backgroundColor: '#2D2D2D', borderRadius: '8px 8px 0 0', zIndex: 2,
        transform: (passwordLength > 0 && showPassword) ? 'skewX(0deg)' : lookingEachOther ? `skewX(${(bp.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)` : (isTyping || hidingPassword) ? `skewX(${(bp.bodySkew || 0) * 1.5}deg)` : `skewX(${bp.bodySkew || 0}deg)`,
        transformOrigin: 'bottom center',
      }}>
        <div className="absolute flex gap-6 transition-all duration-700" style={{
          left: (passwordLength > 0 && showPassword) ? 10 : lookingEachOther ? 32 : 26 + (bp.faceX || 0),
          top: (passwordLength > 0 && showPassword) ? 28 : lookingEachOther ? 12 : 32 + (bp.faceY || 0),
        }}>
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={blackBlink}
            forceLookX={(passwordLength > 0 && showPassword) ? -4 : lookingEachOther ? 0 : undefined}
            forceLookY={(passwordLength > 0 && showPassword) ? -4 : lookingEachOther ? -4 : undefined} />
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={blackBlink}
            forceLookX={(passwordLength > 0 && showPassword) ? -4 : lookingEachOther ? 0 : undefined}
            forceLookY={(passwordLength > 0 && showPassword) ? -4 : lookingEachOther ? -4 : undefined} />
        </div>
      </div>

      {/* Orange semi-circle - front left */}
      <div ref={orangeRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{
        left: 0, width: 240, height: 200, zIndex: 3, backgroundColor: '#FF9B6B', borderRadius: '120px 120px 0 0',
        transform: (passwordLength > 0 && showPassword) ? 'skewX(0deg)' : `skewX(${op.bodySkew || 0}deg)`,
        transformOrigin: 'bottom center',
      }}>
        <div className="absolute flex gap-8 transition-all duration-200" style={{
          left: (passwordLength > 0 && showPassword) ? 50 : 82 + (op.faceX || 0),
          top: (passwordLength > 0 && showPassword) ? 85 : 90 + (op.faceY || 0),
        }}>
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(passwordLength > 0 && showPassword) ? -5 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -4 : undefined} />
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(passwordLength > 0 && showPassword) ? -5 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -4 : undefined} />
        </div>
      </div>

      {/* Yellow - front right */}
      <div ref={yellowRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{
        left: 310, width: 140, height: 230, backgroundColor: '#E8D754', borderRadius: '70px 70px 0 0', zIndex: 4,
        transform: (passwordLength > 0 && showPassword) ? 'skewX(0deg)' : `skewX(${yp.bodySkew || 0}deg)`,
        transformOrigin: 'bottom center',
      }}>
        <div className="absolute flex gap-6 transition-all duration-200" style={{
          left: (passwordLength > 0 && showPassword) ? 20 : 52 + (yp.faceX || 0),
          top: (passwordLength > 0 && showPassword) ? 35 : 40 + (yp.faceY || 0),
        }}>
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(passwordLength > 0 && showPassword) ? -5 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -4 : undefined} />
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(passwordLength > 0 && showPassword) ? -5 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -4 : undefined} />
        </div>
        <div className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200" style={{
          left: (passwordLength > 0 && showPassword) ? 10 : 40 + (yp.faceX || 0),
          top: (passwordLength > 0 && showPassword) ? 88 : 88 + (yp.faceY || 0),
        }} />
      </div>
    </div>
  )
}
