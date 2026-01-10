# 🚀 COMMENCEZ ICI

## Bienvenue dans votre système d'automatisation de blog WordPress!

Ce projet est **100% prêt à l'emploi**. Suivez ces étapes simples pour commencer.

---

## 📚 Quelle documentation lire?

Choisissez selon votre besoin:

### 🏃 Vous voulez démarrer VITE (5-10 minutes)
→ Lisez **[QUICKSTART.md](QUICKSTART.md)**

### 📖 Vous voulez tout comprendre (30 minutes)
→ Lisez **[README.md](README.md)**

### 🔧 Vous voulez utiliser GitHub Actions
→ Lisez **[GITHUB_SETUP.md](GITHUB_SETUP.md)**

### 🏗️ Vous êtes développeur et voulez comprendre l'architecture
→ Lisez **[ARCHITECTURE.md](ARCHITECTURE.md)**

### ✅ Vous voulez savoir quoi faire après le déploiement
→ Lisez **[NEXT_STEPS.md](NEXT_STEPS.md)**

### 📊 Vous voulez une vue d'ensemble du projet
→ Lisez **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)**

---

## ⚡ Démarrage Ultra-Rapide (5 min)

### 1. Push le code sur GitHub (2 min)

```bash
# Créer le repo sur github.com: ElProfessoro/detailingprofrance
git remote add origin https://github.com/ElProfessoro/detailingprofrance.git
git push -u origin main
```

### 2. Créer topics.json sur GitHub (1 min)

Sur GitHub, créer `topics.json`:
```json
[
  {
    "topic": "Les secrets du detailing automobile",
    "keywords": ["detailing", "automobile"],
    "category": "Blog",
    "status": "publish"
  }
]
```

### 3. Déployer (2 min)

```bash
./scripts/first-deploy.sh
```

C'est tout! 🎉

---

## 📋 Checklist Rapide

- [ ] Code pushé sur GitHub
- [ ] topics.json créé sur GitHub
- [ ] wrangler.toml configuré (WORDPRESS_URL, USERNAME)
- [ ] Secrets Cloudflare configurés (via script)
- [ ] Worker déployé
- [ ] Premier article généré et testé

---

## 🎯 Ce que fait le système

1. ✅ Génère des articles SEO de 3500-4500 mots avec Gemini
2. ✅ Crée des images automatiquement avec Cloudflare AI
3. ✅ Upload les images sur Cloudinary
4. ✅ Publie sur WordPress automatiquement
5. ✅ S'exécute selon votre planning (Cron)

## 💰 Coûts

**GRATUIT** pour un usage normal (2-3 articles/semaine)

## 🆘 Besoin d'aide?

- **Démarrage rapide**: [QUICKSTART.md](QUICKSTART.md)
- **Guide complet**: [README.md](README.md)
- **Problèmes**: Vérifiez les logs avec `wrangler tail`

---

## 🎬 Prêt à commencer?

### Option A: Script automatique (recommandé)
```bash
./scripts/first-deploy.sh
```

### Option B: Étape par étape
```bash
# 1. Configurer
cp wrangler.toml.example wrangler.toml
# Éditer wrangler.toml

# 2. Se connecter
wrangler login

# 3. Configurer secrets
wrangler secret put GEMINI_API_KEY
wrangler secret put GITHUB_TOKEN
wrangler secret put CLOUDINARY_API_SECRET
wrangler secret put WORDPRESS_APP_PASSWORD

# 4. Déployer
wrangler deploy

# 5. Tester
curl https://votre-worker.workers.dev/test
```

---

## ✨ Bon blogging automatisé!

**Suivant**: [QUICKSTART.md](QUICKSTART.md) pour les détails du déploiement.
