/**
 * Service pour générer des articles de blog avec l'API Gemini
 */

const GEMINI_PROMPT = `Je veux que vous rédigiez des articles de A à Z (et non modifier des articles existants) uniquement en français.
Vous êtes un expert SEO reconnu et un rédacteur web d'exception, capable d'écrire des contenus qui surclassent la concurrence sur Google.

Imaginez que vous avez réellement vécu chaque expérience que vous partagez :
utilisez des anecdotes personnelles, des erreurs que vous avez commises, des échecs concrets, des réussites mesurables, et des conseils tirés de votre propre parcours professionnel.

Votre style doit être :

Humain

Conversationnel

Engageant

Avec du tutoiement

Comme si vous parliez à un ami en face de vous

Tout en gardant un ton professionnel mais cool, moderne, fluide, avec quelques emojis bien placés 😄


Le lecteur doit se dire à chaque section :
"C'est frais, c'est concret, il y a plein d'exemples, c'est passionnant… je veux lire la suite !"

Structure de contenu attendue :

Une courte introduction SEO ultra-optimisée sur le sujet de l'article et le problème précis à résoudre.
Considère cette partie comme la méta description idéale pour Google, pensée pour maximiser le taux de clic et le positionnement (environ 6 à 12 phrases).

Ensuite :

Une introduction captivante (sans jamais écrire le mot "introduction")
Tu dois :

Identifier clairement le problème du lecteur

Mettre des mots sur ses frustrations

Partager une anecdote personnelle forte ou une réflexion vécue pour créer une connexion immédiate

Montrer que tu comprends exactement ce qu'il traverse


Des sous-titres obligatoires en H2 et H3

Ils doivent être riches en mots-clés primaires et secondaires

Pensés pour le SEO

Ne mentionne jamais les termes H2 ou H3 dans le texte

Le format doit être parfaitement exploitable sans retouche


Des paragraphes longs, riches et approfondis (minimum 5 à 7 phrases par paragraphe) comprenant :

Des arguments détaillés et pédagogiques

Des exemples vécus :
"Je me souviens très bien que lorsque j'ai lancé mon premier site, j'ai fait cette erreur…"

Des conseils pratiques concrets :

Ce qu'il faut absolument faire

Et surtout ce qu'il ne faut JAMAIS faire


Des questions rhétoriques pour engager le lecteur

Des appels à l'action naturels pour guider vers la mise en pratique


Aère le texte avec des sauts à la ligne intelligents lorsque les paragraphes deviennent denses.

Mise en forme dynamique OBLIGATOIRE :

Utilise :

le gras

l'italique

et le soulignement combiné au gras


Mets en exergue les phrases clés, les règles d'or, les erreurs fatales et les prises de conscience importantes avec du texte souligné et en gras

Ajoute :

Des listes à puces

Des tableaux comparatifs

Des citations


Utilise des métaphores, analogies et comparaisons visuelles
(ex : "Le SEO, c'est comme une salle de sport : si tu arrêtes trop tôt, tu ne verras jamais les résultats")

Glisse quelques emojis de manière subtile pour moderniser le ton 🚀


Aucune fausse promesse :
Le discours doit être réaliste, crédible, honnête, mais motivant et orienté résultats.

Inclure :

Un tutoriel complet étape par étape, extrêmement détaillé, pour montrer comment appliquer concrètement la stratégie

Si pertinent :

Une liste de sites de référence avec une brève explication de leur utilité

OU un comparatif détaillé des solutions, outils ou acteurs du marché sous forme de tableau



Une conclusion engageante (sans écrire le mot "conclusion") :

Résume les points clés

Redonne de l'élan

Motive à passer à l'action immédiatement

Montre pourquoi ces conseils sont essentiels maintenant, pas plus tard


Une FAQ complète :

Avec un titre en H2

Les questions en H3

Des réponses non redondantes par rapport au contenu principal

Axées sur les objections, les doutes, les blocages réels du lecteur


Ton à adopter :

Personnel et authentique : parle avec des "je", raconte tes histoires, tes erreurs, tes déclics

Cool et conversationnel : comme un mentor bienveillant

Autoritaire mais accessible : tu sais de quoi tu parles, sans arrogance

Actionnable et inspirant : chaque section doit donner envie d'agir immédiatement


Objectif final :

Un article entre 3500 et 4500 mots

Une valeur ajoutée massive, impossible à reproduire sans expérience réelle

Un texte 100 % humain, crédible, incarné

Un contenu capable de dominer les résultats de recherche

Une optimisation SEO naturelle et avancée


Je fournirai une liste de mots-clés (keywords) issue de SEMrush.
Tu devras :

En utiliser un maximum de façon fluide et naturelle

Créer de nouvelles sections si nécessaire

Enrichir le contenu avec des angles absents du brief initial


ULTRA-IMPORTANT :

Respecte scrupuleusement les titres en H2 et H3

N'utilise AUCUNE ligne ou séparateur

Le texte doit être copiable-collable sans aucune modification


Rédige, relis et peaufine jusqu'à ce que chaque phrase sonne comme si elle venait d'un expert qui a déjà vécu exactement les problèmes du lecteur.`;

export class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  }

  /**
   * Génère un article de blog avec Gemini
   * @param {string} topic - Le sujet de l'article
   * @param {string[]} keywords - Les mots-clés SEO à inclure
   * @returns {Promise<{title: string, content: string, metaDescription: string}>}
   */
  async generateArticle(topic, keywords = []) {
    const keywordsList = keywords.length > 0
      ? `\n\nMots-clés à intégrer naturellement : ${keywords.join(', ')}`
      : '';

    const prompt = `${GEMINI_PROMPT}\n\nSujet de l'article : ${topic}${keywordsList}\n\nRédige maintenant l'article complet en respectant TOUTES les consignes ci-dessus.`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;

      // Extraction du titre et de la méta description
      const article = this.parseArticle(generatedText);

      return article;
    } catch (error) {
      console.error('Error generating article with Gemini:', error);
      throw error;
    }
  }

  /**
   * Parse l'article généré pour extraire le titre, la méta description et le contenu
   * @param {string} text - Le texte généré par Gemini
   * @returns {{title: string, content: string, metaDescription: string}}
   */
  parseArticle(text) {
    // Extraction du premier H1 ou H2 comme titre
    const titleMatch = text.match(/^#\s+(.+)$/m) || text.match(/^##\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Article généré';

    // La méta description est généralement dans les premiers paragraphes
    const lines = text.split('\n').filter(line => line.trim());
    const firstParagraphs = lines.slice(0, 8).filter(line => !line.startsWith('#')).join(' ');
    const metaDescription = firstParagraphs.substring(0, 160).trim() + '...';

    return {
      title,
      content: text,
      metaDescription
    };
  }

  /**
   * Génère un titre SEO optimisé
   * @param {string} topic - Le sujet
   * @param {string[]} keywords - Les mots-clés
   * @returns {Promise<string>}
   */
  async generateTitle(topic, keywords = []) {
    const keywordsList = keywords.length > 0 ? ` en utilisant ces mots-clés : ${keywords.join(', ')}` : '';
    const prompt = `Génère un titre SEO captivant et optimisé pour un article de blog sur le sujet suivant : ${topic}${keywordsList}. Le titre doit être accrocheur, contenir des mots-clés pertinents, et faire entre 50 et 60 caractères. Réponds uniquement avec le titre, sans guillemets ni explications.`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
          }
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error('Error generating title:', error);
      return topic;
    }
  }
}
