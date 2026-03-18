/**
 * gallery.js — Three.js vertical timeline gallery
 * Projects arranged chronologically; scroll drives camera through time.
 * Mouse parallax tilts the scene; hover highlights; click navigates.
 */
import * as THREE from 'three'

// ─── Config ───────────────────────────────────────────────────────────────────
const CARD_ASPECT  = 1.6
const BASE_W       = 3.0
const TEX_W        = 960
const TEX_H        = 600
const PARALLAX_X   = 0.16   // mouse X → scene tilt (yaw)
const PARALLAX_Y   = 0.06   // mouse Y → scene tilt (pitch)
const FLOAT_AMP    = 0.05
const FLOAT_SPEED  = 0.38
const CAM_LERP     = 0.07

// World-space Y for each year (top = 2025, bottom = 2019)
const YEAR_Y = {
  2025:  8.0,
  2024:  4.8,
  2023:  1.6,
  2022: -1.6,
  2021: -4.8,
  2020: -7.2,
  2019: -9.6,
}

const CAM_START = 10.5   // camera Y at scroll = 0  (above 2025)
const CAM_END   = -12.0  // camera Y at scroll = 1  (below 2019)
const LINE_TOP  =  9.2
const LINE_BOT  = -11.0

// ─── Projects (ordered newest → oldest) ──────────────────────────────────────
const PROJECTS = [
  {
    id: 'mrbeast',
    title: 'Salesforce × MrBeast',
    url: 'projects/mrbeast-puzzle.html',
    thumb: 'https://img.youtube.com/vi/Lp9OEfkWfLI/maxresdefault.jpg',
    tags: ['AI', 'Game Design'],
    category: 'ai',
    year: 2025, company: 'Salesforce',
    side: 'right', xOff: 4.8, zOff: 0.5, size: 1.45,
  },
  {
    id: 'sentiment-mesh',
    title: 'Sentiment Mesh',
    url: 'projects/sentiment-mesh.html',
    thumb: null,
    tags: ['Data Viz', 'Three.js'],
    category: 'ai',
    year: 2025, company: 'Personal',
    side: 'left', xOff: -4.0, zOff: -0.4, size: 1.05,
  },
  {
    id: 'synoptophore',
    title: 'VR Synoptophore',
    url: 'projects/vr-synoptophore.html',
    thumb: 'assets/images/vr-synoptophore-img.png',
    tags: ['VR', 'Health Tech'],
    category: 'xr',
    year: 2024, company: 'UC Davis',
    side: 'right', xOff: 4.2, zOff: 0.2, size: 1.1,
  },
  {
    id: 'ar-pen-pals',
    title: 'AR Pen Pals',
    url: 'projects/ar-pen-pals.html',
    thumb: 'assets/images/thumb-ar-pen-pals.jpg',
    tags: ['AR', 'Education'],
    category: 'xr',
    year: 2024, company: 'MIT Reality Hack',
    side: 'left', xOff: -3.8, zOff: -0.3, size: 0.92,
  },
  {
    id: 'creative-auto',
    title: 'Creative Automation',
    url: 'projects/creative-automation.html',
    thumb: null,
    tags: ['AI', 'Robotics'],
    category: 'ai',
    year: 2023, company: 'Salesforce',
    side: 'right', xOff: 4.0, zOff: 0.0, size: 0.95,
  },
  {
    id: 'vr-careers',
    title: 'VR Careers',
    url: 'projects/vr-careers.html',
    thumb: 'assets/images/Interview%20Prep%20Cover.png',
    tags: ['VR', 'UX'],
    category: 'xr',
    year: 2022, company: 'Meta',
    side: 'left', xOff: -4.2, zOff: 0.3, size: 1.0,
  },
  {
    id: 'klo',
    title: 'Keeping the Lights On',
    url: 'projects/keeping-lights-on.html',
    thumb: 'assets/images/thumb-keeping-lights-on.jpg',
    tags: ['Campaign', 'Brand'],
    category: '',
    year: 2021, company: 'Facebook',
    side: 'right', xOff: 4.5, zOff: -0.2, size: 1.1,
  },
  {
    id: 'vr-mindfulness',
    title: 'Zen Doodle Oasis',
    url: 'projects/vr-mindfulness.html',
    thumb: 'assets/images/thumb-vr-mindfulness.jpg',
    tags: ['VR', 'Mindfulness'],
    category: 'xr',
    year: 2020, company: 'Personal',
    side: 'left', xOff: -4.0, zOff: 0.4, size: 0.92,
  },
  {
    id: 'art-plinko',
    title: 'Art Plinko',
    url: 'https://artplinko.netlify.app',
    thumb: null,
    tags: ['Interactive', 'Generative'],
    category: 'games',
    year: 2020, company: 'Personal',
    side: 'right', xOff: 3.8, zOff: -0.5, size: 0.88,
  },
  {
    id: 'nanaverse',
    title: 'Nanaverse',
    url: 'https://nanaverse.netlify.app/',
    thumb: null,
    tags: ['World Building'],
    category: 'games',
    year: 2019, company: 'Personal',
    side: 'left', xOff: -3.6, zOff: 0.2, size: 0.88,
  },
  {
    id: 'finding-primrose',
    title: 'Finding Primrose',
    url: 'https://stummo.itch.io/finding-primrose',
    thumb: null,
    tags: ['Game', 'Narrative'],
    category: 'games',
    year: 2019, company: 'Personal',
    side: 'right', xOff: 3.6, zOff: -0.3, size: 0.85,
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
    // Dot grid
    ctx.fillStyle = '#1d1d1d'
    for (let x = 22; x < TEX_W; x += 22)
      for (let y = 22; y < TEX_H; y += 22) {
        ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill()
      }
    // Ghost words
    const words = project.title.toUpperCase().split(' ').slice(0, 2)
    ctx.font = `700 ${Math.floor(TEX_H * 0.25)}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1
    words.forEach((w, i) => {
      ctx.strokeText(w, TEX_W / 2, TEX_H * 0.38 + i * TEX_H * 0.27)
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
    ctx.arcTo(tx + rw, ry, tx + rw, ry + r, r)
    ctx.lineTo(tx + rw, ry + rh - r)
    ctx.arcTo(tx + rw, ry + rh, tx + rw - r, ry + rh, r)
    ctx.lineTo(tx + r, ry + rh)
    ctx.arcTo(tx, ry + rh, tx, ry + rh - r, r)
    ctx.lineTo(tx, ry + r)
    ctx.arcTo(tx, ry, tx + r, ry, r)
    ctx.closePath(); ctx.stroke()
    ctx.fillStyle = '#5A5A5A'
    ctx.fillText(tag, tx + pw, TEX_H - 16)
    tx += rw + 8
  })

  return new THREE.CanvasTexture(canvas)
}

// ─── Year label texture ───────────────────────────────────────────────────────
function makeYearLabel(year, companies) {
  const W = 480, H = 110
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, W, H)

  // Year number
  ctx.font = `700 62px Inter, system-ui, sans-serif`
  ctx.fillStyle = '#BBFF00'
  ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(String(year), W - 8, 72)

  // Company / institution
  const label = [...new Set(companies.filter(Boolean))].join(' · ')
  ctx.font = `500 21px Inter, system-ui, sans-serif`
  ctx.fillStyle = '#3a3a3a'
  ctx.fillText(label, W - 8, 100)

  const tex = new THREE.CanvasTexture(canvas)
  // World plane: keep aspect ratio
  const worldW = 2.1, worldH = worldW * (H / W)
  const geo = new THREE.PlaneGeometry(worldW, worldH)
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  return new THREE.Mesh(geo, mat)
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
    this._buildTimeline()
    this._loadAndBuildCards()
    this._bindEvents()
  }

  _init() {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.setSize(w, h, false)
    this.renderer.setClearColor(0x080808)

    this.scene  = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x080808, 0.038)

    this.camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 60)
    this.camera.position.set(0, CAM_START, 7.5)

    this.group = new THREE.Group()
    this.scene.add(this.group)
  }

  _buildTimeline() {
    const ACCENT = 0xBBFF00

    // ── Vertical line ──────────────────────────────────────────────────────
    const lineH = LINE_TOP - LINE_BOT
    const lineGeo = new THREE.PlaneGeometry(0.012, lineH)
    const lineMat = new THREE.MeshBasicMaterial({
      color: ACCENT, transparent: true, opacity: 0.28, depthWrite: false,
    })
    const line = new THREE.Mesh(lineGeo, lineMat)
    line.position.set(0, (LINE_TOP + LINE_BOT) / 2, -1.5)
    this.group.add(line)

    // ── Per-year tick marks + labels ──────────────────────────────────────
    // Group companies by year
    const yearCompanies = {}
    PROJECTS.forEach(p => {
      if (!yearCompanies[p.year]) yearCompanies[p.year] = []
      yearCompanies[p.year].push(p.company)
    })

    Object.entries(YEAR_Y).forEach(([yearStr, y]) => {
      const year = Number(yearStr)
      const companies = yearCompanies[year] || []

      // Tick mark (horizontal)
      const tickGeo = new THREE.PlaneGeometry(0.5, 0.009)
      const tickMat = new THREE.MeshBasicMaterial({
        color: ACCENT, transparent: true, opacity: 0.7, depthWrite: false,
      })
      const tick = new THREE.Mesh(tickGeo, tickMat)
      tick.position.set(0, y, -1.4)
      this.group.add(tick)

      // Dot at tick centre
      const dotGeo = new THREE.CircleGeometry(0.045, 16)
      const dotMat = new THREE.MeshBasicMaterial({ color: ACCENT })
      const dot = new THREE.Mesh(dotGeo, dotMat)
      dot.position.set(0, y, -1.3)
      this.group.add(dot)

      // Year label (right-aligned, left of line)
      if (companies.length > 0) {
        const labelMesh = makeYearLabel(year, companies)
        // Right edge of label at x = -0.2 (just left of the line)
        labelMesh.position.set(-0.2 - 2.1 / 2, y, -1.45)
        this.group.add(labelMesh)
      }
    })
  }

  async _loadAndBuildCards() {
    await document.fonts.ready
    const images = await Promise.all(PROJECTS.map(p => loadImage(p.thumb)))

    PROJECTS.forEach((project, i) => {
      const texture = makeCardTexture(project, images[i])
      const w = BASE_W * project.size
      const h = w / CARD_ASPECT

      const geo     = new THREE.PlaneGeometry(w, h)
      const mat     = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1 })
      const mesh    = new THREE.Mesh(geo, mat)

      // Position: year Y + side offset
      const baseY = YEAR_Y[project.year]
      mesh.position.set(project.xOff, baseY, project.zOff)

      // Subtle tilt toward center
      mesh.rotation.y = project.side === 'right' ? -0.06 : 0.06

      // Hover outline
      const oGeo    = new THREE.PlaneGeometry(w + 0.07, h + 0.07)
      const oMat    = new THREE.MeshBasicMaterial({ color: 0xBBFF00, transparent: true, opacity: 0 })
      const outline = new THREE.Mesh(oGeo, oMat)
      outline.position.z = -0.01
      mesh.add(outline)

      mesh.userData = {
        project,
        origPos:       mesh.position.clone(),
        origRotY:      mesh.rotation.y,
        phase:         Math.random() * Math.PI * 2,
        targetScale:   1,
        curScale:      1,
        targetOpacity: 1,
        outline,
      }

      this.group.add(mesh)
      this.meshes.push(mesh)
    })

    this._animate()
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

    // Per-card animation
    this.meshes.forEach(m => {
      const d = m.userData

      // Gentle float
      m.position.y = d.origPos.y + Math.sin(t * FLOAT_SPEED + d.phase) * FLOAT_AMP
      m.position.x = d.origPos.x + Math.cos(t * FLOAT_SPEED * 0.55 + d.phase) * FLOAT_AMP * 0.4

      // Scale (hover)
      d.curScale += (d.targetScale - d.curScale) * 0.1
      m.scale.setScalar(d.curScale)

      // Opacity (filter)
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
      const w = this.canvas.clientWidth
      const h = this.canvas.clientHeight
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
