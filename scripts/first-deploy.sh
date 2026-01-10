#!/bin/bash

# Script d'aide pour le premier déploiement

set -e

echo "🚀 Assistant de déploiement - Détailing Pro France Blog Automation"
echo "=================================================================="
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

echo "✅ Répertoire du projet détecté"
echo ""

# Vérifier si wrangler est installé
if ! command -v wrangler &> /dev/null; then
    echo "📦 Wrangler n'est pas installé. Installation en cours..."
    npm install
    echo "✅ Wrangler installé"
else
    echo "✅ Wrangler déjà installé"
fi
echo ""

# Vérifier si wrangler.toml existe
if [ ! -f "wrangler.toml" ]; then
    echo "📝 Création de wrangler.toml depuis le template..."
    cp wrangler.toml.example wrangler.toml
    echo "✅ wrangler.toml créé"
    echo ""
    echo "⚠️  IMPORTANT: Vous devez éditer wrangler.toml et configurer:"
    echo "   - WORDPRESS_URL"
    echo "   - WORDPRESS_USERNAME"
    echo ""
    read -p "Appuyez sur Entrée après avoir modifié wrangler.toml..."
else
    echo "✅ wrangler.toml existe déjà"
fi
echo ""

# Vérifier la connexion Cloudflare
echo "🔐 Vérification de la connexion Cloudflare..."
if wrangler whoami &> /dev/null; then
    echo "✅ Connecté à Cloudflare"
else
    echo "📋 Connexion à Cloudflare nécessaire..."
    wrangler login
    echo "✅ Connecté à Cloudflare"
fi
echo ""

# Configuration des secrets
echo "🔑 Configuration des secrets Cloudflare Workers"
echo "Vous allez configurer 4 secrets nécessaires au fonctionnement"
echo ""

read -p "Configurer GEMINI_API_KEY? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "Clé par défaut: VOTRE_GEMINI_API_KEY"
    wrangler secret put GEMINI_API_KEY
fi

read -p "Configurer GITHUB_TOKEN? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "Token par défaut: VOTRE_GITHUB_TOKEN"
    wrangler secret put GITHUB_TOKEN
fi

read -p "Configurer CLOUDINARY_API_SECRET? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "Secret par défaut: VOTRE_CLOUDINARY_SECRET"
    wrangler secret put CLOUDINARY_API_SECRET
fi

read -p "Configurer WORDPRESS_APP_PASSWORD? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "Password par défaut: VOTRE_WORDPRESS_PASSWORD"
    wrangler secret put WORDPRESS_APP_PASSWORD
fi

echo ""
echo "✅ Secrets configurés"
echo ""

# Déploiement
echo "🚀 Prêt pour le déploiement!"
echo ""
read -p "Déployer sur Cloudflare Workers maintenant? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo ""
    echo "📤 Déploiement en cours..."
    wrangler deploy
    echo ""
    echo "✅ Déploiement réussi!"
    echo ""
    echo "🎉 Votre worker est maintenant en ligne!"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "   1. Créer le fichier topics.json sur GitHub"
    echo "   2. Tester avec: curl https://votre-worker.workers.dev/test"
    echo "   3. Générer votre premier article"
    echo ""
    echo "📚 Consultez NEXT_STEPS.md pour plus de détails"
else
    echo ""
    echo "ℹ️  Déploiement annulé"
    echo ""
    echo "Pour déployer plus tard, exécutez:"
    echo "   wrangler deploy"
fi

echo ""
echo "✨ Configuration terminée!"
