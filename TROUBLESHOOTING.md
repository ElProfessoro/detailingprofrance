# 🔧 Dépannage et Solutions

## ⚠️ Quota Gemini API dépassé

### Problème
```
Error: Gemini API error: 429 - Quota exceeded
```

### Cause
L'API clé Gemini a atteint sa limite gratuite:
- **Limite gratuite**: 1500 requêtes par jour
- **Reset**: Quotidien (minuit UTC)

### Solutions

#### Option 1: Attendre le reset quotidien ⏰
Le quota se réinitialise automatiquement à minuit UTC.
- Vos articles planifiés reprendront automatiquement le lendemain
- Pas d'action nécessaire

#### Option 2: Créer une nouvelle clé API Gemini (recommandé) 🔑

1. Allez sur https://aistudio.google.com/app/apikey
2. Créez un nouveau projet Google Cloud (si nécessaire)
3. Générez une nouvelle API key
4. Mettez à jour le secret Cloudflare:

```bash
echo "VOTRE_NOUVELLE_CLE" | npx wrangler secret put GEMINI_API_KEY
```

5. Testez:
```bash
curl https://detailingprofrance-blog-automation.msalla-youssef.workers.dev/test
```

#### Option 3: Passer au plan payant Gemini 💳

Pour un usage intensif:
1. Allez sur https://console.cloud.google.com/
2. Activez la facturation
3. Le plan payant offre:
   - 1 million de tokens gratuits par mois
   - Puis ~0.10€ pour 1M tokens
   - Idéal pour 500+ articles/mois

### Prévention

#### Surveiller votre usage
https://ai.dev/rate-limit

#### Ajuster la fréquence
Si vous dépassez souvent le quota gratuit, réduisez la fréquence dans `wrangler.toml`:

```toml
[triggers]
# Au lieu de tous les jours:
crons = ["0 9 * * *"]

# Passer à 2x par semaine:
crons = ["0 9 * * 1,4"]  # Lundi et Jeudi
```

## 🔐 Erreur d'authentification WordPress

### Problème
```
Error: WordPress authentication failed
```

### Solutions

#### 1. Créer un mot de passe d'application

1. Connectez-vous à WordPress: https://detailingprofrance.fr/wp-admin
2. Allez dans **Utilisateurs** > **Profil**
3. Descendez à "Mots de passe d'application"
4. Nom: "Blog Automation"
5. Cliquez sur "Ajouter un nouveau mot de passe d'application"
6. Copiez le mot de passe généré (format: `xxxx xxxx xxxx xxxx xxxx xxxx`)

#### 2. Mettre à jour le secret Cloudflare

```bash
echo "VOTRE_MOT_DE_PASSE_APPLICATION" | npx wrangler secret put WORDPRESS_APP_PASSWORD
```

#### 3. Vérifier l'API REST

```bash
curl https://detailingprofrance.fr/wp-json/wp/v2/posts
```

Si vous recevez une erreur 404, l'API REST n'est pas activée:
- Allez dans WordPress > Réglages > Permaliens
- Cliquez sur "Enregistrer" (même sans changement)
- Cela réinitialise les permaliens et active l'API

## 🖼️ Images non générées

### Problème
Articles publiés sans images

### Solutions

#### Vérifier le binding Cloudflare AI
Le binding doit être dans `wrangler.toml`:
```toml
[ai]
binding = "AI"
```

#### Redéployer
```bash
npx wrangler deploy
```

## 📁 Fichier topics.json vide

### Problème
Le worker ne trouve pas de sujets

### Solution
Vérifiez que `topics.json` existe sur GitHub:
https://github.com/ElProfessoro/detailingprofrance/blob/main/topics.json

Si absent, créez-le:
```json
[
  {
    "topic": "Votre sujet",
    "keywords": ["mot1", "mot2"],
    "category": "Blog",
    "status": "publish"
  }
]
```

## 🔑 Secrets non configurés

### Problème
```
Error: XXXX is not defined
```

### Solution
Configurez tous les secrets:

```bash
# Vérifier quels secrets sont configurés
npx wrangler secret list

# Configurer les secrets manquants
echo "VALEUR" | npx wrangler secret put GEMINI_API_KEY
echo "VALEUR" | npx wrangler secret put GITHUB_TOKEN
echo "VALEUR" | npx wrangler secret put CLOUDINARY_API_SECRET
echo "VALEUR" | npx wrangler secret put WORDPRESS_APP_PASSWORD
```

## 🌐 Worker ne répond pas

### Problème
Timeout ou erreur 502

### Solutions

#### 1. Vérifier le déploiement
```bash
npx wrangler deploy
```

#### 2. Voir les logs
```bash
npx wrangler tail
```

#### 3. Vérifier le dashboard
https://dash.cloudflare.com/

## 📊 Monitoring

### Voir les logs en temps réel
```bash
npx wrangler tail
```

### Dashboard Cloudflare
https://dash.cloudflare.com/
- Workers & Pages > detailingprofrance-blog-automation
- Métriques d'exécution
- Logs d'erreurs
- Statistiques d'utilisation

### Vérifier l'état du worker
```bash
curl https://detailingprofrance-blog-automation.msalla-youssef.workers.dev/test
```

## 🆘 Besoin d'aide supplémentaire?

1. Consultez les logs: `npx wrangler tail`
2. Vérifiez le dashboard Cloudflare
3. Ouvrez une issue sur GitHub
4. Consultez la documentation officielle:
   - Cloudflare Workers: https://developers.cloudflare.com/workers/
   - Gemini API: https://ai.google.dev/gemini-api/docs
   - WordPress REST API: https://developer.wordpress.org/rest-api/

---

**Mise à jour**: 10 janvier 2026
