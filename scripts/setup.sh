#!/bin/bash

# Script de configuration automatique du système de blog

set -e

echo "🚀 Configuration du système d'automatisation de blog WordPress"
echo ""

# Vérification de npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez installer Node.js et npm."
    exit 1
fi

# Vérification de wrangler
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installation de Wrangler..."
    npm install
fi

echo "✅ Wrangler est installé"
echo ""

# Connexion à Cloudflare
echo "🔐 Connexion à Cloudflare..."
wrangler login

echo ""
echo "📝 Configuration des secrets Cloudflare Workers..."
echo ""

# Configuration des secrets
echo "🔑 Configuration de GEMINI_API_KEY..."
echo "Clé par défaut: VOTRE_GEMINI_API_KEY"
wrangler secret put GEMINI_API_KEY

echo ""
echo "🔑 Configuration de GITHUB_TOKEN..."
echo "Token par défaut: VOTRE_GITHUB_TOKEN"
wrangler secret put GITHUB_TOKEN

echo ""
echo "🔑 Configuration de CLOUDINARY_API_SECRET..."
echo "Secret par défaut: VOTRE_CLOUDINARY_SECRET"
wrangler secret put CLOUDINARY_API_SECRET

echo ""
echo "🔑 Configuration de WORDPRESS_APP_PASSWORD..."
echo "Password par défaut: VOTRE_WORDPRESS_PASSWORD"
wrangler secret put WORDPRESS_APP_PASSWORD

echo ""
echo "📄 Création du fichier wrangler.toml..."

if [ ! -f "wrangler.toml" ]; then
    cp wrangler.toml.example wrangler.toml
    echo "✅ wrangler.toml créé"
    echo ""
    echo "⚠️  N'oubliez pas de modifier wrangler.toml avec:"
    echo "   - WORDPRESS_URL"
    echo "   - WORDPRESS_USERNAME"
else
    echo "⚠️  wrangler.toml existe déjà, conservation du fichier existant"
fi

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Modifier wrangler.toml avec vos paramètres WordPress"
echo "   2. Créer le repo GitHub: ElProfessoro/detailingprofrance"
echo "   3. Créer topics.json sur GitHub"
echo "   4. Déployer avec: wrangler deploy"
echo ""
echo "📚 Consultez QUICKSTART.md pour plus de détails"
