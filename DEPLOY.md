# Deploying to GitHub Pages with pozlong.com

## Step 1 — Create the GitHub repo
1. Go to github.com → New repository
2. Name it `pozlong.com` (or anything you like)
3. Set it to **Public** (required for free GitHub Pages)
4. Do NOT initialize with README

## Step 2 — Push the site
```bash
cd /Users/pozlong/Dev/Website2026
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pozlong.com.git
git push -u origin main
```

## Step 3 — Enable GitHub Pages
1. In the repo → Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: `main` / `/ (root)`
4. Save → GitHub gives you a `*.github.io` URL in ~1 min

## Step 4 — Point pozlong.com to GitHub
In your domain registrar (wherever you manage pozlong.com), add:

**A records (apex domain):**
```
@ → 185.199.108.153
@ → 185.199.109.153
@ → 185.199.110.153
@ → 185.199.111.153
```

**CNAME record (www subdomain):**
```
www → YOUR_USERNAME.github.io
```

## Step 5 — Set custom domain in GitHub
1. Repo Settings → Pages → Custom domain
2. Enter: `pozlong.com`
3. Check "Enforce HTTPS" (takes ~24h for DNS to propagate)

## Adding images
Drop your images in `assets/images/` matching these filenames:

| File | Used for |
|------|----------|
| `mrbeast-puzzle-hero.jpg` | MrBeast project hero |
| `mrbeast-puzzle-01..04.jpg` | MrBeast gallery |
| `mrbeast-puzzle-video-poster.jpg` | Video thumbnail |
| `creative-automation-hero.jpg` | Creative Automation hero |
| `vr-synoptophore-hero.jpg` | VR Synoptophore hero |
| `vr-careers-hero.jpg` | VR Careers hero |
| `sentiment-mesh-hero.jpg` | Sentiment Mesh hero |
| `keeping-lights-on-hero.jpg` | Keeping the Lights On hero |
| `ar-pen-pals-hero.jpg` | AR Pen Pals hero |
| `vr-mindfulness-hero.jpg` | Zen Doodle Oasis hero |
| `poz-portrait.jpg` | About section portrait |
| `og-image.jpg` | Social share preview (1200×630) |

For each project, add 4 gallery images: `[slug]-01.jpg` through `[slug]-04.jpg`

## Adding the making-of video
Drop the video at: `assets/videos/mrbeast-puzzle-making-of.mp4`

Or swap in a YouTube embed — see the comment in `projects/mrbeast-puzzle.html`

## MrBeast project copy
Open `projects/mrbeast-puzzle.html` and replace the placeholder text in the
"Why we made it" and "How it was made" sections with your actual copy.
Also update the subtitle, tech stack, and recognition fields.

## Updating after changes
```bash
git add .
git commit -m "Add images and project copy"
git push
```
GitHub redeploys automatically in ~30 seconds.
