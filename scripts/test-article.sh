#!/bin/bash

# Script pour tester la génération d'un article manuellement

if [ -z "$1" ]; then
    echo "Usage: ./scripts/test-article.sh <worker-url>"
    echo "Exemple: ./scripts/test-article.sh https://detailing-blog.workers.dev"
    exit 1
fi

WORKER_URL=$1

echo "🧪 Test de génération d'article sur: $WORKER_URL"
echo ""

# Test de la route /test
echo "1️⃣ Test de la configuration..."
curl -s "$WORKER_URL/test" | json_pp

echo ""
echo ""

# Génération d'un article de test
echo "2️⃣ Génération d'un article de test en brouillon..."
echo ""

TOPIC="Les techniques avancées de polissage automobile pour débutants"
KEYWORDS='["polissage auto", "detailing débutant", "polish voiture", "technique polissage"]'
CATEGORY="Tutoriels"

echo "Sujet: $TOPIC"
echo "Mots-clés: $KEYWORDS"
echo "Catégorie: $CATEGORY"
echo ""

curl -X POST "$WORKER_URL/generate-article" \
  -H "Content-Type: application/json" \
  -d "{
    \"topic\": \"$TOPIC\",
    \"keywords\": $KEYWORDS,
    \"category\": \"$CATEGORY\",
    \"status\": \"draft\"
  }" | json_pp

echo ""
echo ""
echo "✅ Test terminé!"
echo ""
echo "📝 Vérifiez vos brouillons WordPress pour voir l'article généré"
