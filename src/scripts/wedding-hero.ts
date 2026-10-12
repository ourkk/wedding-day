/** Animate wedding ambience over a stationary CSS photo. */
export function initWeddingHero() {
  const hero = document.querySelector<HTMLElement>('#landing')
  const canvas = document.querySelector<HTMLCanvasElement>('#wedding-canvas')
  const context = canvas?.getContext('2d')
  const audio = document.querySelector<HTMLAudioElement>('#wedding-music')

  if (hero && canvas && context) {
    const ctx = context
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = 0
    let height = 0
    let frame = 0
    let lastFrame = 0
    let elapsed = 0
    let visible = true
    const particles = Array.from({ length: 64 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      size: 3 + Math.random() * 6,
      speed: 0.012 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2,
      petal: i % 3 === 0,
    }))
    const accents = Array.from({ length: 24 }, (_, i) => ({
      // Frame the portrait so the larger effects stay away from faces and names.
      x: i % 2 === 0 ? Math.random() * 0.25 : 0.75 + Math.random() * 0.25,
      y: Math.random(),
      size: 8 + Math.random() * 18,
      phase: Math.random() * Math.PI * 2,
      speed: 0.006 + Math.random() * 0.01,
      kind: i % 3,
    }))

    function drawAccents(time: number) {
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      for (const accent of accents.slice(0, width < 768 ? 15 : 24)) {
        const x = accent.x * width + Math.sin(time * 0.3 + accent.phase) * 14
        const progress = (accent.y + time * accent.speed) % 1
        const y = height * (1 - progress)
        const fade = Math.min(1, progress * 8, (1 - progress) * 8)
        const pulse = 0.6 + Math.sin(time * 0.8 + accent.phase) * 0.4
        const size = accent.size * (width < 768 ? 0.7 : 1)
        ctx.save()
        ctx.translate(x, y)
        ctx.globalAlpha = fade * (accent.kind === 0 ? 0.3 : 0.45) * pulse
        if (accent.kind === 0) {
          // Soft champagne and blush bokeh, with a translucent lens rim.
          const bokeh = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
          bokeh.addColorStop(0, '#ffe9c480')
          bokeh.addColorStop(0.65, '#ffe5de28')
          bokeh.addColorStop(0.85, '#fff0d555')
          bokeh.addColorStop(1, '#fff0d500')
          ctx.fillStyle = bokeh
          ctx.fillRect(-size, -size, size * 2, size * 2)
        } else if (accent.kind === 1) {
          // Fine heart outlines rise gently along the sides of the portrait.
          ctx.rotate(Math.sin(time * 0.5 + accent.phase) * 0.15)
          ctx.scale(size / 20, size / 20)
          ctx.beginPath()
          ctx.moveTo(0, 6)
          ctx.bezierCurveTo(-22, -8, -10, -22, 0, -11)
          ctx.bezierCurveTo(10, -22, 22, -8, 0, 6)
          ctx.strokeStyle = '#ffe5de'
          ctx.lineWidth = 1
          ctx.shadowColor = '#ffcfbc'
          ctx.shadowBlur = 8
          ctx.stroke()
        } else {
          // Four-point stars shimmer slowly rather than flashing.
          const radius = size * (0.2 + pulse * 0.15)
          ctx.rotate(accent.phase + time * 0.08)
          ctx.beginPath()
          ctx.moveTo(0, -radius)
          ctx.quadraticCurveTo(1, -1, radius, 0)
          ctx.quadraticCurveTo(1, 1, 0, radius)
          ctx.quadraticCurveTo(-1, 1, -radius, 0)
          ctx.quadraticCurveTo(-1, -1, 0, -radius)
          ctx.fillStyle = '#fff5dc'
          ctx.shadowColor = '#ffdb9a'
          ctx.shadowBlur = 12
          ctx.fill()
        }
        ctx.restore()
      }
      ctx.restore()
    }

    function render() {
      if (!width || !height) return
      const time = elapsed / 1000
      ctx.clearRect(0, 0, width, height)
      const glow = ctx.createRadialGradient(
        width * 0.16,
        height * 0.2,
        0,
        width * 0.16,
        height * 0.2,
        width * 0.85
      )
      glow.addColorStop(0, `rgba(255,224,179,${0.19 + Math.sin(time * 0.25) * 0.04})`)
      glow.addColorStop(1, 'rgba(255,224,179,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)
      drawAccents(time)
      for (const particle of particles.slice(0, width < 768 ? 40 : 64)) {
        const x = particle.x * width + Math.sin(time * 0.4 + particle.phase) * 25
        const y = ((particle.y + time * particle.speed) % 1.1) * height - height * 0.05
        const overCouple = x > width * 0.3 && x < width * 0.7 && y < height * 0.65
        ctx.save()
        ctx.globalAlpha =
          (overCouple ? 0.12 : 0.45) * (0.65 + Math.sin(time + particle.phase) * 0.25)
        ctx.translate(x, y)
        ctx.rotate(time * 0.35 + particle.phase)
        ctx.fillStyle = particle.petal ? '#ffe6e4' : '#fff0cc'
        ctx.beginPath()
        if (particle.petal) {
          ctx.ellipse(0, 0, particle.size, particle.size * 0.45, 0, 0, Math.PI * 2)
        } else {
          ctx.shadowColor = '#ffe0a3'
          ctx.shadowBlur = 10
          ctx.arc(0, 0, particle.size * 0.3, 0, Math.PI * 2)
        }
        ctx.fill()
        ctx.restore()
      }
    }

    function tick(now: number) {
      frame = 0
      if (!visible || document.hidden || reducedMotion.matches) return
      if (now - lastFrame >= 1000 / 30) {
        elapsed += lastFrame ? Math.min(now - lastFrame, 80) : 0
        lastFrame = now
        render()
      }
      frame = requestAnimationFrame(tick)
    }

    function syncAnimation() {
      cancelAnimationFrame(frame)
      lastFrame = 0
      if (visible && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(tick)
      else render()
    }

    function resize() {
      const bounds = canvas!.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas!.width = Math.round(width * ratio)
      canvas!.height = Math.round(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      render()
    }

    // The effects match the fixed viewport layer, rather than the scrolling content.
    new ResizeObserver(resize).observe(canvas)
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      syncAnimation()
    }).observe(hero)
    document.addEventListener('visibilitychange', syncAnimation)
    reducedMotion.addEventListener('change', syncAnimation)
    resize()
    syncAnimation()
  }

  if (audio) {
    audio.volume = 0.3
    let pending = false
    let started = false
    const onStarted = () => {
      started = true
      document.removeEventListener('pointerdown', startMusic)
      document.removeEventListener('keydown', startMusic)
    }
    // Start immediately, or on the first page interaction if autoplay is blocked.
    async function startMusic() {
      if (pending || started) return
      pending = true
      try {
        await audio!.play()
        onStarted()
      } catch {
        // Keep listening for a user gesture; no playback controls are displayed.
      } finally {
        pending = false
      }
    }
    audio.addEventListener('play', onStarted)
    document.addEventListener('pointerdown', startMusic)
    document.addEventListener('keydown', startMusic)
    void startMusic()
  }
}
