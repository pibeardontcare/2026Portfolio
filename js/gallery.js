/**
 * gallery.js — Three.js vertical timeline gallery
 * Timeline line on left. Cards in two columns to the right.
 * Scroll drives camera through time (2026 → 2019).
 */
import * as THREE from 'three'

// ─── Config ───────────────────────────────────────────────────────────────────
const CARD_ASPECT  = 1.6
const CARD_SIZE    = 1.0         // uniform — all cards same size
const CARD_W       = 3.0 * CARD_SIZE
const CARD_H       = CARD_W / CARD_ASPECT
const TEX_W        = 960
const TEX_H        = 600
const PARALLAX_X   = 0.10
const PARALLAX_Y   = 0.04
const FLOAT_AMP    = 0.04
const FLOAT_SPEED  = 0.38
const CAM_LERP     = 0.07
const ACCENT_CSS   = '#3DC9C0'
const ACCENT_HEX   = 0x3DC9C0

// Timeline X position (left side of canvas)
const TIMELINE_X   = -5.2
// Cards start X (right of timeline)
const COL_A_X      =  0.6        // left column
const COL_B_X      =  4.0        // right column
const SINGLE_X     =  2.3        // single card per year — centered between cols

// World-space Y per year
const YEAR_Y = {
  2026: 10.0,
  2025:  7.2,
  2024:  4.4,
  2023:  1.6,
  2022: -1.2,
  2021: -4.0,
  2020: -6.4,
  2019: -8.8,
}

const CAM_START =  12.5  // camera Y at scroll = 0
const CAM_END   = -11.5  // camera Y at scroll = 1
const LINE_TOP  =  11.5
const LINE_BOT  = -11.0

// Camera slightly right of center to balance timeline (left) + cards (right)
const CAM_X = -0.5

// ─── Projects (newest → oldest) ──────────────────────────────────────────────
//   col: 'a' | 'b' | 'single'  (position within year)
const PROJECTS = [
  {
    id: 'mrbeast',
    title: 'Salesforce × MrBeast',
    url: 'projects/mrbeast-puzzle.html',
    thumb: 'https://img.youtube.com/vi/Lp9OEfkWfLI/maxresdefault.jpg',
    tags: ['AI', 'Game Design'],
    category: 'ai',
    year: 2026, company: 'Salesforce', col: 'single', zOff: 0.3,
  },
  {
    id: 'sentiment-mesh',
    title: 'Sentiment Mesh',
    url: 'projects/sentiment-mesh.html',
    thumb: null,
    tags: ['Data Viz', 'Three.js'],
    category: 'ai',
    year: 2025, company: 'Personal', col: 'single', zOff: -0.2,
  },
  {
    id: 'synoptophore',
    title: 'VR Synoptophore',
    url: 'projects/vr-synoptophore.html',
    thumb: 'assets/images/vr-synoptophore-img.png',
    tags: ['VR', 'Health Tech'],
    category: 'xr',
    year: 2024, company: 'UC Davis', col: 'a', zOff: 0.2,
  },
  {
    id: 'ar-pen-pals',
    title: 'AR Pen Pals',
    url: 'projects/ar-pen-pals.html',
    thumb: 'assets/images/thumb-ar-pen-pals.jpg',
    tags: ['AR', 'Education'],
    category: 'xr',
    year: 2024, company: 'MIT Reality Hack', col: 'b', zOff: -0.2,
  },
  {
    id: 'creative-auto',
    title: 'Creative Automation',
    url: 'projects/creative-automation.html',
    thumb: null,
    tags: ['AI', 'Robotics'],
    category: 'ai',
    year: 2023, company: 'Salesforce', col: 'single', zOff: 0.1,
  },
  {
    id: 'vr-careers',
    title: 'VR Careers',
    url: 'projects/vr-careers.html',
    thumb: 'assets/images/Interview%20Prep%20Cover.png',
    tags: ['VR', 'UX'],
    category: 'xr',
    year: 2022, company: 'Meta', col: 'single', zOff: 0.2,
  },
  {
    id: 'klo',
    title: 'Keeping the Lights On',
    url: 'projects/keeping-lights-on.html',
    thumb: 'assets/images/thumb-keeping-lights-on.jpg',
    tags: ['Campaign', 'Brand'],
    category: '',
    year: 2021, company: 'Facebook', col: 'single', zOff: -0.1,
  },
  {
    id: 'vr-mindfulness',
    title: 'Zen Doodle Oasis',
    url: 'projects/vr-mindfulness.html',
    thumb: 'assets/images/thumb-vr-mindfulness.jpg',
    tags: ['VR', 'Mindfulness'],
    category: 'xr',
    year: 2020, company: 'Personal', col: 'a', zOff: 0.3,
  },
  {
    id: 'art-plinko',
    title: 'Art Plinko',
    url: 'https://artplinko.netlify.app',
    thumb: null,
    tags: ['Interactive', 'Generative'],
    category: 'games',
    year: 2020, company: 'Personal', col: 'b', zOff: -0.3,
  },
  {
    id: 'nanaverse',
    title: 'Nanaverse',
    url: 'https://nanaverse.netlify.app/',
    thumb: null,
    tags: ['World Building'],
    category: 'games',
    year: 2019, company: 'Personal', col: 'a', zOff: 0.1,
  },
  {
    id: 'finding-primrose',
    title: 'Finding Primrose',
    url: 'https://stummo.itch.io/finding-primrose',
    thumb: null,
    tags: ['Game', 'Narrative'],
    category: 'games',
    year: 2019, company: 'Personal', col: 'b', zOff: -0.1,
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function colToX(col) {
  if (col === 'a')      return COL_A_X
  if (col === 'b')      return COL_B_X
  return SINGLE_X
}

function loadImage(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// ─── Card texture ─────────────────────────────────────────────────────────────
function makeCardTexture(project, img) {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_W; canvas.height = TEX_H
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#101010'
  ctx.fillRect(0, 0, TEX_W, TEX_H)

  if (img) {
    const imgH = Math.round(TEX_H * 0.68)
    const scale = Math.max(TEX_W / img.naturalWidth, imgH / img.naturalHeight)
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale
    const dx = (TEX_W - dw) / 2,        dy = (imgH - dh) / 2
    ctx.save()
    ctx.beginPath(); ctx.rect(0, 0, TEX_W, imgH); ctx.clip()
    ctx.drawImage(img, dx, dy, dw, dh)
    ctx.restore()
    const grad = ctx.createLinearGradient(0, imgH * 0.3, 0, TEX_H)
    grad.addColorStop(0,    'rgba(16,16,16,0)')
    grad.addColorStop(0.52, 'rgba(16,16,16,0.9)')
    grad.addColorStop(1,    'rgba(16,16,16,1)')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, TEX_W, TEX_H)
  } else {
    ctx.fillStyle = '#1d1d1d'
    for (let x = 22; x < TEX_W; x += 22)
      for (let y = 22; y < TEX_H; y += 22) {
        ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill()
      }
    const words = project.title.toUpperCase().split(' ').slice(0, 2)
    ctx.font = `700 ${Math.floor(TEX_H * 0.24)}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1
    words.forEach((w, i) => {
      ctx.strokeText(w, TEX_W / 2, TEX_H * 0.36 + i * TEX_H * 0.26)
    })
  }

  // Title
  ctx.font = `600 ${Math.floor(TEX_H * 0.068)}px Inter, system-ui, sans-serif`
  ctx.fillStyle = '#F0F0F0'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(project.title, 32, TEX_H - 58)

  // Tags
  ctx.font = `500 ${Math.floor(TEX_H * 0.037)}px Inter, system-ui, sans-serif`
  let tx = 32
  project.tags.forEach(tag => {
    const tw = ctx.measureText(tag).width
    const pw = 12, rh = 22, r = 3, rw = tw + pw * 2, ry = TEX_H - 34
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(tx + r, ry); ctx.lineTo(tx + rw - r, ry)
    ctx.arcTo(tx + rw, ry,      tx + rw, ry + r,      r)
    ctx.lineTo(tx + rw, ry + rh - r)
    ctx.arcTo(tx + rw, ry + rh, tx + rw - r, ry + rh, r)
    ctx.lineTo(tx + r,  ry + rh)
    ctx.arcTo(tx, ry + rh,      tx, ry + rh - r,      r)
    ctx.lineTo(tx, ry + r)
    ctx.arcTo(tx, ry,           tx + r, ry,            r)
    ctx.closePath(); ctx.stroke()
    ctx.fillStyle = '#5A5A5A'
    ctx.fillText(tag, tx + pw, TEX_H - 16)
    tx += rw + 8
  })

  return new THREE.CanvasTexture(canvas)
}

// ─── Year label texture ───────────────────────────────────────────────────────
function makeYearLabelTexture(year, companies) {
  const W = 360, H = 100
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, W, H)

  ctx.font = `700 58px Inter, system-ui, sans-serif`
  ctx.fillStyle = ACCENT_CSS
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(String(year), 0, 66)

  const label = [...new Set(companies.filter(Boolean))].join(' · ')
  ctx.font = `400 20px Inter, system-ui, sans-serif`
  ctx.fillStyle = '#3a3a3a'
  ctx.fillText(label, 0, 92)

  return new THREE.CanvasTexture(canvas)
}

// ─── Gallery class ────────────────────────────────────────────────────────────
class ProjectGallery {
  constructor(canvasEl, trackEl) {
    this.canvas    = canvasEl
    this.track     = trackEl
    this.raycaster = new THREE.Raycaster()
    this.pointer   = new THREE.Vector2()
    this.smoothPtr = new THREE.Vector2()
    this.hovered   = null
    this.filter    = 'all'
    this.clock     = new THREE.Clock()
    this.meshes    = []

    this._init()
    this._loadAndBuild()   // builds timeline + cards after fonts ready
    this._bindEvents()
  }

  _init() {
    const w = window.innerWidth
    const h = window.innerHeight

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.setSize(w, h, false)
    this.renderer.setClearColor(0x080808)

    this.scene  = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 60)
    this.camera.position.set(CAM_X, CAM_START, 7.5)

    this.group = new THREE.Group()
    this.scene.add(this.group)
  }

  async _loadAndBuild() {
    // Wait for fonts so year labels render correctly
    await document.fonts.ready

    this._buildTimeline()

    const images = await Promise.all(PROJECTS.map(p => loadImage(p.thumb)))
    PROJECTS.forEach((project, i) => this._buildCard(project, images[i]))

    this._animate()
  }

  _buildTimeline() {
    // ── Vertical line ────────────────────────────────────────────────────────
    const lineH   = LINE_TOP - LINE_BOT
    const lineGeo = new THREE.PlaneGeometry(0.018, lineH)
    const lineMat = new THREE.MeshBasicMaterial({
      color: ACCENT_HEX, transparent: true, opacity: 0.35, depthWrite: false,
    })
    const line = new THREE.Mesh(lineGeo, lineMat)
    line.position.set(TIMELINE_X, (LINE_TOP + LINE_BOT) / 2, -1.0)
    this.group.add(line)

    // ── Collect companies per year ───────────────────────────────────────────
    const byYear = {}
    PROJECTS.forEach(p => {
      if (!byYear[p.year]) byYear[p.year] = []
      byYear[p.year].push(p.company)
    })

    // ── Per-year markers + labels ────────────────────────────────────────────
    Object.entries(YEAR_Y).forEach(([yrStr, y]) => {
      const year = Number(yrStr)

      // Dot
      const dotGeo = new THREE.CircleGeometry(0.055, 16)
      const dotMat = new THREE.MeshBasicMaterial({ color: ACCENT_HEX })
      const dot    = new THREE.Mesh(dotGeo, dotMat)
      dot.position.set(TIMELINE_X, y, -0.9)
      this.group.add(dot)

      // Short tick extending right toward cards
      const tickGeo = new THREE.PlaneGeometry(0.45, 0.009)
      const tickMat = new THREE.MeshBasicMaterial({
        color: ACCENT_HEX, transparent: true, opacity: 0.55, depthWrite: false,
      })
      const tick = new THREE.Mesh(tickGeo, tickMat)
      tick.position.set(TIMELINE_X + 0.225, y, -0.95)
      this.group.add(tick)

      // Year + company label (to the right of line)
      const companies = byYear[year] || []
      const tex       = makeYearLabelTexture(year, companies)
      const labelW    = 2.0
      const labelH    = labelW * (100 / 360)
      const labelGeo  = new THREE.PlaneGeometry(labelW, labelH)
      const labelMat  = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
      const label     = new THREE.Mesh(labelGeo, labelMat)
      // Left-align: left edge at TIMELINE_X + 0.25
      label.position.set(TIMELINE_X + 0.25 + labelW / 2, y + labelH * 0.55, -0.95)
      this.group.add(label)
    })
  }

  _buildCard(project, img) {
    const texture = makeCardTexture(project, img)
    const geo     = new THREE.PlaneGeometry(CARD_W, CARD_H)
    const mat     = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1 })
    const mesh    = new THREE.Mesh(geo, mat)

    const x = colToX(project.col)
    const y = YEAR_Y[project.year]
    mesh.position.set(x, y, project.zOff)

    // Hover outline
    const oGeo    = new THREE.PlaneGeometry(CARD_W + 0.07, CARD_H + 0.07)
    const oMat    = new THREE.MeshBasicMaterial({ color: ACCENT_HEX, transparent: true, opacity: 0 })
    const outline = new THREE.Mesh(oGeo, oMat)
    outline.position.z = -0.01
    mesh.add(outline)

    mesh.userData = {
      project,
      origPos:       mesh.position.clone(),
      phase:         Math.random() * Math.PI * 2,
      targetScale:   1,
      curScale:      1,
      targetOpacity: 1,
      outline,
    }

    this.group.add(mesh)
    this.meshes.push(mesh)
  }

  _getScrollProgress() {
    if (!this.track) return 0
    const { top, height } = this.track.getBoundingClientRect()
    const scrollable = height - window.innerHeight
    if (scrollable <= 0) return 0
    return Math.max(0, Math.min(1, -top / scrollable))
  }

  _animate() {
    requestAnimationFrame(() => this._animate())
    const t = this.clock.getElapsedTime()

    // Scroll → camera Y
    const progress = this._getScrollProgress()
    const targetY  = CAM_START + progress * (CAM_END - CAM_START)
    this.camera.position.y += (targetY - this.camera.position.y) * CAM_LERP

    // Mouse → scene tilt
    this.smoothPtr.x += (this.pointer.x - this.smoothPtr.x) * 0.04
    this.smoothPtr.y += (this.pointer.y - this.smoothPtr.y) * 0.04
    this.group.rotation.y += ( this.smoothPtr.x * PARALLAX_X - this.group.rotation.y) * 0.06
    this.group.rotation.x += (-this.smoothPtr.y * PARALLAX_Y - this.group.rotation.x) * 0.06

    this.meshes.forEach(m => {
      const d = m.userData

      // Idle float
      m.position.y = d.origPos.y + Math.sin(t * FLOAT_SPEED + d.phase) * FLOAT_AMP
      m.position.x = d.origPos.x + Math.cos(t * FLOAT_SPEED * 0.55 + d.phase) * FLOAT_AMP * 0.4

      // Scale
      d.curScale += (d.targetScale - d.curScale) * 0.1
      m.scale.setScalar(d.curScale)

      // Opacity
      m.material.opacity += (d.targetOpacity - m.material.opacity) * 0.07

      // Outline
      const oTarget = (m === this.hovered && d.targetOpacity > 0.5) ? 0.55 : 0
      d.outline.material.opacity += (oTarget - d.outline.material.opacity) * 0.12
    })

    this.renderer.render(this.scene, this.camera)
  }

  _bindEvents() {
    window.addEventListener('mousemove', e => {
      const r = this.canvas.getBoundingClientRect()
      if (e.clientY < r.top || e.clientY > r.bottom) return
      this.pointer.x =  ((e.clientX - r.left) / r.width)  * 2 - 1
      this.pointer.y = -((e.clientY - r.top)  / r.height) * 2 + 1

      this.raycaster.setFromCamera(this.pointer, this.camera)
      const hits = this.raycaster.intersectObjects(this.meshes)
      const prev = this.hovered

      if (hits.length) {
        this.hovered = hits[0].object
        if (this.hovered !== prev) {
          if (prev) prev.userData.targetScale = 1
          this.hovered.userData.targetScale = 1.05
          this.canvas.style.cursor = 'pointer'
        }
      } else {
        if (prev) { prev.userData.targetScale = 1; this.canvas.style.cursor = '' }
        this.hovered = null
      }
    })

    this.canvas.addEventListener('click', () => {
      if (!this.hovered) return
      const { project } = this.hovered.userData
      if (project.url.startsWith('http')) window.open(project.url, '_blank')
      else window.location.href = project.url
    })

    window.addEventListener('resize', () => {
      const w = window.innerWidth
      const h = window.innerHeight
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(w, h, false)
    })
  }

  setFilter(f) {
    this.filter = f
    this.meshes.forEach(m => {
      const match = f === 'all' || m.userData.project.category === f
      m.userData.targetOpacity = match ? 1 : 0.08
    })
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
const canvasEl = document.getElementById('gallery-canvas')
const trackEl  = document.querySelector('.gallery-scroll-track')

if (canvasEl) {
  const gallery = new ProjectGallery(canvasEl, trackEl)

  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => {
        b.classList.remove('active')
        b.setAttribute('aria-selected', 'false')
      })
      btn.classList.add('active')
      btn.setAttribute('aria-selected', 'true')
      gallery.setFilter(btn.dataset.filter)
    })
  })
}
