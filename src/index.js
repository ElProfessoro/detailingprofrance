/**
 * Cloudflare Worker principal pour l'automatisation de blog WordPress
 * Génère des articles SEO avec Gemini, des images avec Cloudflare AI,
 * les upload sur Cloudinary et publie sur WordPress
 */

import { GeminiService } from './services/gemini.js';
import { ImageGeneratorService } from './services/imageGenerator.js';
import { CloudinaryService } from './services/cloudinary.js';
import { WordPressService } from './services/wordpress.js';

export default {
  /**
   * Gestion des requêtes HTTP
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route pour générer et publier un article
    if (url.pathname === '/generate-article' && request.method === 'POST') {
      return await this.handleGenerateArticle(request, env);
    }

    // Route pour tester la configuration
    if (url.pathname === '/test' && request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'Blog automation worker is running',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Route pour lister les articles générés
    if (url.pathname === '/articles' && request.method === 'GET') {
      return await this.handleListArticles(env);
    }

    return new Response('Not found', { status: 404 });
  },

  /**
   * Gestion des Cron Triggers
   * Déclenché automatiquement selon le planning configuré dans wrangler.toml
   */
  async scheduled(event, env, ctx) {
    console.log('Cron trigger activated at:', new Date(event.scheduledTime).toISOString());

    // Liste de sujets prédéfinis pour la génération automatique
    const topics = await this.getTopicsFromGitHub(env);

    if (topics.length > 0) {
      // Générer un article pour le premier sujet de la liste
      const topic = topics[0];
      await this.generateAndPublishArticle(topic, env);

      // Retirer le sujet de la liste
      await this.removeTopicFromGitHub(env, topic);
    } else {
      console.log('No topics available for article generation');
    }
  },

  /**
   * Génère et publie un article complet
   */
  async generateAndPublishArticle(topicData, env) {
    try {
      console.log('Starting article generation for:', topicData.topic);

      // Initialisation des services
      const gemini = new GeminiService(env.GEMINI_API_KEY);
      const imageGen = new ImageGeneratorService(env.AI);
      const cloudinary = new CloudinaryService(
        env.CLOUDINARY_CLOUD_NAME,
        env.CLOUDINARY_API_KEY,
        env.CLOUDINARY_API_SECRET,
        env.CLOUDINARY_UPLOAD_PRESET
      );
      const wordpress = new WordPressService(
        env.WORDPRESS_URL,
        env.WORDPRESS_USERNAME,
        env.WORDPRESS_APP_PASSWORD,
        env.WORDPRESS_AUTH_TYPE || 'basic'
      );

      // 1. Génération de l'article avec Gemini
      console.log('Generating article with Gemini...');
      const article = await gemini.generateArticle(
        topicData.topic,
        topicData.keywords || []
      );

      // 2. Génération de l'image à la une avec Cloudflare AI (optionnel)
      let cloudinaryResult = null;
      const articleSlug = wordpress.slugify(article.title);

      try {
        console.log('Generating featured image with Cloudflare AI...');
        const imagePrompt = `${article.title}, professional photography, high quality, modern, clean, vibrant colors, 4k resolution, blog header image`;
        const featuredImage = await imageGen.generateImage(imagePrompt, {
          width: 1200,
          height: 630
        });

        // 3. Upload de l'image sur Cloudinary
        console.log('Uploading image to Cloudinary...');
        cloudinaryResult = await cloudinary.uploadImage(featuredImage, {
          folder: `blog-articles/${articleSlug}`,
          filename: `${articleSlug}-featured`,
          tags: ['blog', 'auto-generated', articleSlug],
          altText: article.title
        });
      } catch (imageError) {
        console.warn('Image generation failed, continuing without image:', imageError.message);
        // Continue without image
      }

      // 4. Publication sur WordPress
      console.log('Publishing to WordPress...');
      const wpResult = await wordpress.publishCompleteArticle({
        title: article.title,
        content: article.content,
        metaDescription: article.metaDescription,
        keywords: topicData.keywords || [],
        categoryName: topicData.category || 'Blog',
        featuredImageUrl: cloudinaryResult ? cloudinaryResult.secureUrl : null,
        featuredImageAlt: article.title,
        status: topicData.status || 'publish'
      });

      console.log('Article published successfully:', wpResult.url);

      return {
        success: true,
        article: {
          title: article.title,
          wordpressUrl: wpResult.url,
          imageUrl: cloudinaryResult ? cloudinaryResult.secureUrl : null,
          publishDate: wpResult.date
        }
      };
    } catch (error) {
      console.error('Error generating and publishing article:', error);
      throw error;
    }
  },

  /**
   * Handler pour la route de génération manuelle d'article
   */
  async handleGenerateArticle(request, env) {
    try {
      const body = await request.json();
      const { topic, keywords = [], category = 'Blog', status = 'draft' } = body;

      if (!topic) {
        return new Response(JSON.stringify({
          error: 'Topic is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const result = await this.generateAndPublishArticle({
        topic,
        keywords,
        category,
        status
      }, env);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * Handler pour lister les articles WordPress
   */
  async handleListArticles(env) {
    try {
      const wordpress = new WordPressService(
        env.WORDPRESS_URL,
        env.WORDPRESS_USERNAME,
        env.WORDPRESS_APP_PASSWORD,
        env.WORDPRESS_AUTH_TYPE || 'basic'
      );

      const posts = await wordpress.getPosts(20, 1);

      return new Response(JSON.stringify({
        count: posts.length,
        posts: posts.map(post => ({
          id: post.id,
          title: post.title.rendered,
          url: post.link,
          date: post.date,
          status: post.status
        }))
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * Récupère la liste des sujets depuis GitHub
   */
  async getTopicsFromGitHub(env) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${env.GITHUB_REPO}/contents/topics.json`,
        {
          headers: {
            'Authorization': `token ${env.GITHUB_TOKEN}`,
            'User-Agent': 'Cloudflare-Worker',
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        // Si le fichier n'existe pas encore, retourner un tableau vide
        if (response.status === 404) {
          return [];
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      const content = atob(data.content);
      const topics = JSON.parse(content);

      return topics;
    } catch (error) {
      console.error('Error fetching topics from GitHub:', error);
      return [];
    }
  },

  /**
   * Retire un sujet de la liste GitHub après traitement
   */
  async removeTopicFromGitHub(env, processedTopic) {
    try {
      // Récupérer la liste actuelle
      const response = await fetch(
        `https://api.github.com/repos/${env.GITHUB_REPO}/contents/topics.json`,
        {
          headers: {
            'Authorization': `token ${env.GITHUB_TOKEN}`,
            'User-Agent': 'Cloudflare-Worker',
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      const data = await response.json();
      const content = atob(data.content);
      const topics = JSON.parse(content);

      // Retirer le sujet traité
      const updatedTopics = topics.filter(t => t.topic !== processedTopic.topic);

      // Mettre à jour le fichier sur GitHub
      const updateResponse = await fetch(
        `https://api.github.com/repos/${env.GITHUB_REPO}/contents/topics.json`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${env.GITHUB_TOKEN}`,
            'User-Agent': 'Cloudflare-Worker',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Remove processed topic: ${processedTopic.topic}`,
            content: btoa(JSON.stringify(updatedTopics, null, 2)),
            sha: data.sha
          })
        }
      );

      if (!updateResponse.ok) {
        throw new Error(`Failed to update topics file: ${updateResponse.status}`);
      }

      console.log('Topic removed from GitHub:', processedTopic.topic);
    } catch (error) {
      console.error('Error removing topic from GitHub:', error);
    }
  }
};
