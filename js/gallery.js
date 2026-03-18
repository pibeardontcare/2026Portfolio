/**
 * gallery.js — Three.js floating project card gallery
 * Cards are textured 3D planes floating in dark space.
 * Mouse parallax drifts the scene; click navigates to project.
 */
import * as THREE from 'three'

// ─── Config ───────────────────────────────────────────────────────────────────
const CARD_ASPECT  = 1.6     // width ÷ height of each card
const BASE_W       = 3.0     // world-space width of a size-1 card
const TEX_W        = 960     // canvas texture width  (px)
const TEX_H        = 600     // canvas texture height (px)
const PARALLAX     = 0.22    // max group rotation from mouse (rad)
const FLOAT_AMP    = 0.07    // idle float amplitude
const FLOAT_SPEED  = 0.45    // idle float speed

// ─── Project data ─────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    id: 'mrbeast',
    title: 'Salesforce × MrBeast',
    url: 'projects/mrbeast-puzzle.html',
    thumb: 'https://img.youtube.com/vi/Lp9OEfkWfLI/maxresdefault.jpg',
    tags: ['AI', 'Game Design'],
    category: 'ai',
    pos: [0, 0.4, 1.0],
    rot: [0.02, -0.04, -0.01],
    size: 1.45,
  },
  {
    id: 'klo',
    title: 'Keeping the Lights On',
    url: 'projects/keeping-lights-on.html',
    thumb: 'assets/images/thumb-keeping-lights-on.jpg',
    tags: ['Campaign', 'Brand'],
    category: '',
    pos: [-3.0, 0.8, -0.4],
    rot: [0.01, 0.06, 0.02],
    size: 1.1,
  },
  {
    id: 'synoptophore',
    title: 'VR Synoptophore',
    url: 'projects/vr-synoptophore.html',
    thumb: 'assets/images/vr-synoptophore-img.png',
    tags: ['VR', 'Health Tech'],
    category: 'xr',
    pos: [2.8, 0.6, 0.0],
    rot: [-0.01, -0.05, 0.015],
    size: 1.1,
  },
  {
    id: 'creative-auto',
    title: 'Creative Automation',
    url: 'projects/creative-automation.html',
    thumb: null,
    tags: ['AI', 'Robotics'],
    category: 'ai',
    pos: [-3.8, -1.2, -1.0],
    rot: [0.03, 0.08, -0.02],
    size: 0.92,
  },
  {
    id: 'vr-careers',
    title: 'VR Careers',
    url: 'projects/vr-careers.html',
    thumb: 'assets/images/Interview%20Prep%20Cover.png',
    tags: ['VR', 'UX'],
    category: 'xr',
    pos: [0.4, -1.6, 0.5],
    rot: [-0.02, 0.03, 0.01],
    size: 0.95,
  },
  {
    id: 'ar-pen-pals',
    title: 'AR Pen Pals',
    url: 'projects/ar-pen-pals.html',
    thumb: 'assets/images/thumb-ar-pen-pals.jpg',
    tags: ['AR', 'Education'],
    category: 'xr',
    pos: [3.5, -0.9, -0.6],
    rot: [0.01, -0.07, 0.02],
    size: 0.90,
  },
  {
    id: 'vr-mindfulness',
    title: 'Zen Doodle Oasis',
    url: 'projects/vr-mindfulness.html',
    thumb: 'assets/images/thumb-vr-mindfulness.jpg',
    tags: ['VR', 'Mindfulness'],
    category: 'xr',
    pos: [-1.6, -2.4, 0.2],
    rot: [0.02, 0.04, -0.015],
    size: 0.90,
  },
  {
    id: 'nanaverse',
    title: 'Nanaverse',
    url: 'https://nanaverse.netlify.app/',
    thumb: null,
    tags: ['World Building'],
    category: 'games',
    pos: [1.8, -2.6, -0.5],
    rot: [-0.01, -0.04, 0.02],
    size: 0.88,
  },
  {
    id: 'finding-primrose',
    title: 'Finding Primrose',
    url: 'https://stummo.itch.io/finding-primrose',
    thumb: null,
    tags: ['Game', 'Narrative'],
    category: 'games',
    pos: [4.0, -2.0, -1.2],
    rot: [0.02, -0.06, 0.01],
    size: 0.85,
  },
  {
    id: 'art-plinko',
    title: 'Art Plinko',
    url: 'https://artplinko.netlify.app',
    thumb: null,
    tags: ['Interactive', 'Generative'],
    category: 'games',
    pos: [-3.2, -2.8, 0.3],
    rot: [-0.03, 0.05, -0.02],
    size: 0.85,
  },
  {
    id: 'sentiment-mesh',
    title: 'Sentiment Mesh',
    url: 'projects/sentiment-mesh.html',
    thumb: null,
    tags: ['Data Viz', 'Three.js'],
    category: 'ai',
    pos: [2.2, 1.8, -1.4],
    rot: [0.01, -0.03, 0.01],
    size: 1.2,
  },
]

// ─── Image loader ─────────────────────────────────────────────────────────────
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
  canvas.width  = TEX_W
  canvas.height = TEX_H
  const ctx = canvas.getContext('2d')

  // Base background
  ctx.fillStyle = '#101010'
  ctx.fillRect(0, 0, TEX_W, TEX_H)

  if (img) {
    // Photo fills top ~68%, fades to dark
    const imgH = Math.round(TEX_H * 0.68)
    const scale = Math.max(TEX_W / img.naturalWidth, imgH / img.naturalHeight)
    const dw = img.naturalWidth  * scale
    const dh = img.naturalHeight * scale
    const dx = (TEX_W - dw) / 2
    const dy = (imgH  - dh) / 2

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, TEX_W, imgH)
    ctx.clip()
    ctx.drawImage(img, dx, dy, dw, dh)
    ctx.restore()

    const grad = ctx.createLinearGradient(0, imgH * 0.32, 0, TEX_H)
    grad.addColorStop(0,    'rgba(16,16,16,0)')
    grad.addColorStop(0.52, 'rgba(16,16,16,0.90)')
    grad.addColorStop(1,    'rgba(16,16,16,1)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, TEX_W, TEX_H)
  } else {
    // No image: dot grid + ghost word(s)
    ctx.fillStyle = '#1d1d1d'
    for (let x = 22; x < TEX_W; x += 22) {
      for (let y = 22; y < TEX_H; y += 22) {
        ctx.beginPath()
        ctx.arc(x, y, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const words = project.title.toUpperCase().split(' ').slice(0, 2)
    ctx.font = `700 ${Math.floor(TEX_H * 0.25)}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 1
    words.forEach((word, i) => {
      const yOff = (i - (words.length - 1) / 2) * TEX_H * 0.27
      ctx.strokeText(word, TEX_W / 2, TEX_H * 0.40 + yOff)
    })
  }

  // Title
  ctx.font = `600 ${Math.floor(TEX_H * 0.068)}px Inter, system-ui, sans-serif`
  ctx.fillStyle = '#F0F0F0'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(project.title, 32, TEX_H - 58)

  // Tag pills
  ctx.font = `500 ${Math.floor(TEX_H * 0.037)}px Inter, system-ui, sans-serif`
  let tx = 32
  project.tags.forEach(tag => {
    const tw = ctx.measureText(tag).width
    const pw = 12, rh = 22, r = 3
    const rw = tw + pw * 2
    const ry = TEX_H - 34

    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(tx + r, ry)
    ctx.lineTo(tx + rw - r, ry)
    ctx.arcTo(tx + rw, ry,      tx + rw, ry + r,      r)
    ctx.lineTo(tx + rw, ry + rh - r)
    ctx.arcTo(tx + rw, ry + rh, tx + rw - r, ry + rh, r)
    ctx.lineTo(tx + r, ry + rh)
    ctx.arcTo(tx,      ry + rh, tx,      ry + rh - r, r)
    ctx.lineTo(tx,      ry + r)
    ctx.arcTo(tx,      ry,      tx + r,  ry,           r)
    ctx.closePath()
    ctx.stroke()

    ctx.fillStyle = '#5A5A5A'
    ctx.fillText(tag, tx + pw, TEX_H - 16)
    tx += rw + 8
  })

  return new THREE.CanvasTexture(canvas)
}

// ─── Gallery class ────────────────────────────────────────────────────────────
class ProjectGallery {
  constructor(canvasEl) {
    this.canvas    = canvasEl
    this.raycaster = new THREE.Raycaster()
    this.pointer   = new THREE.Vector2()
    this.smoothPtr = new THREE.Vector2()
    this.hovered   = null
    this.filter    = 'all'
    this.clock     = new THREE.Clock()
    this.meshes    = []

    this._init()
    this._loadAndBuild()
    this._bindEvents()
  }

  _init() {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.setSize(w, h, false)
    this.renderer.setClearColor(0x080808)

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x080808, 0.048)

    this.camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 50)
    this.camera.position.z = 7.5

    this.group = new THREE.Group()
    this.scene.add(this.group)
  }

  async _loadAndBuild() {
    await document.fonts.ready
    const images = await Promise.all(PROJECTS.map(p => loadImage(p.thumb)))

    PROJECTS.forEach((project, i) => {
      const texture = makeCardTexture(project, images[i])
      const w = BASE_W * project.size
      const h = w / CARD_ASPECT

      const geo     = new THREE.PlaneGeometry(w, h)
      const mat     = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1 })
      const mesh    = new THREE.Mesh(geo, mat)

      mesh.position.set(...project.pos)
      mesh.rotation.set(...project.rot)

      // Hover outline — slightly larger plane, accent colour, behind card
      const oGeo    = new THREE.PlaneGeometry(w + 0.07, h + 0.07)
      const oMat    = new THREE.MeshBasicMaterial({ color: 0xBBFF00, transparent: true, opacity: 0 })
      const outline = new THREE.Mesh(oGeo, oMat)
      outline.position.z = -0.01
      mesh.add(outline)

      mesh.userData = {
        project,
        origPos:        new THREE.Vector3(...project.pos),
        origRot:        [...project.rot],
        phase:          Math.random() * Math.PI * 2,
        targetScale:    1,
        curScale:       1,
        targetOpacity:  1,
        outline,
      }

      this.group.add(mesh)
      this.meshes.push(mesh)
    })

    this._animate()
  }

  _animate() {
    requestAnimationFrame(() => this._animate())
    const t = this.clock.getElapsedTime()

    // Smooth pointer → parallax group tilt
    this.smoothPtr.x += (this.pointer.x - this.smoothPtr.x) * 0.04
    this.smoothPtr.y += (this.pointer.y - this.smoothPtr.y) * 0.04
    this.group.rotation.x += (-this.smoothPtr.y * PARALLAX - this.group.rotation.x) * 0.06
    this.group.rotation.y += ( this.smoothPtr.x * PARALLAX - this.group.rotation.y) * 0.06

    this.meshes.forEach(m => {
      const d = m.userData

      // Idle float
      m.position.y = d.origPos.y + Math.sin(t * FLOAT_SPEED + d.phase) * FLOAT_AMP
      m.position.x = d.origPos.x + Math.cos(t * FLOAT_SPEED * 0.6 + d.phase) * FLOAT_AMP * 0.5
      m.rotation.z = d.origRot[2] + Math.sin(t * 0.28 + d.phase) * 0.012

      // Scale lerp (hover)
      d.curScale += (d.targetScale - d.curScale) * 0.1
      m.scale.setScalar(d.curScale)

      // Opacity lerp (filter)
      m.material.opacity += (d.targetOpacity - m.material.opacity) * 0.07

      // Outline opacity
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
      m.userData.targetOpacity = match ? 1 : 0.1
    })
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
const canvasEl = document.getElementById('gallery-canvas')
if (canvasEl) {
  const gallery = new ProjectGallery(canvasEl)

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
