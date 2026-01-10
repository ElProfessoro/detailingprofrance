/**
 * Service pour générer des images avec Cloudflare AI Workers
 * Utilise le modèle Stable Diffusion disponible gratuitement sur Cloudflare
 */

export class ImageGeneratorService {
  constructor(aiBinding) {
    this.ai = aiBinding;
  }

  /**
   * Génère une image à partir d'un prompt
   * @param {string} prompt - Description de l'image à générer
   * @param {object} options - Options de génération
   * @returns {Promise<ArrayBuffer>} - Image générée en format binaire
   */
  async generateImage(prompt, options = {}) {
    const {
      width = 1024,
      height = 768,
      numSteps = 20,
      guidance = 7.5
    } = options;

    try {
      // Utilisation du modèle Stable Diffusion XL de Cloudflare
      const response = await this.ai.run(
        '@cf/stabilityai/stable-diffusion-xl-base-1.0',
        {
          prompt: prompt,
          num_steps: numSteps,
          guidance: guidance,
          width: width,
          height: height
        }
      );

      return response;
    } catch (error) {
      console.error('Error generating image with Cloudflare AI:', error);
      throw error;
    }
  }

  /**
   * Génère plusieurs images pour un article
   * @param {string} articleTitle - Titre de l'article
   * @param {string[]} sections - Sections principales de l'article
   * @param {number} count - Nombre d'images à générer
   * @returns {Promise<ArrayBuffer[]>} - Tableau d'images générées
   */
  async generateArticleImages(articleTitle, sections = [], count = 3) {
    const prompts = this.createImagePrompts(articleTitle, sections, count);
    const images = [];

    for (const prompt of prompts) {
      try {
        const image = await this.generateImage(prompt, {
          width: 1200,
          height: 630 // Format optimal pour les featured images WordPress
        });
        images.push(image);

        // Petit délai pour éviter de surcharger l'API
        await this.delay(1000);
      } catch (error) {
        console.error(`Failed to generate image for prompt: ${prompt}`, error);
      }
    }

    return images;
  }

  /**
   * Crée des prompts optimisés pour la génération d'images d'article de blog
   * @param {string} title - Titre de l'article
   * @param {string[]} sections - Sections de l'article
   * @param {number} count - Nombre de prompts à créer
   * @returns {string[]} - Tableau de prompts
   */
  createImagePrompts(title, sections, count) {
    const baseStyle = 'professional photography, high quality, modern, clean, vibrant colors, 4k resolution';
    const prompts = [];

    // Image principale (featured image)
    prompts.push(
      `${title}, ${baseStyle}, blog header image, eye-catching composition`
    );

    // Images pour les sections
    if (sections.length > 0 && count > 1) {
      const sectionsToIllustrate = sections.slice(0, count - 1);
      sectionsToIllustrate.forEach(section => {
        prompts.push(
          `${section}, ${baseStyle}, illustrative, informative, blog content image`
        );
      });
    }

    // Images génériques si nécessaire
    while (prompts.length < count) {
      prompts.push(
        `${title}, ${baseStyle}, supporting image, conceptual illustration`
      );
    }

    return prompts.slice(0, count);
  }

  /**
   * Génère une image optimisée pour le SEO
   * @param {string} topic - Sujet de l'image
   * @param {string} style - Style visuel souhaité
   * @returns {Promise<ArrayBuffer>}
   */
  async generateSEOImage(topic, style = 'professional') {
    const stylePrompts = {
      professional: 'professional photography, high quality, modern office, business setting',
      creative: 'creative illustration, colorful, artistic, eye-catching design',
      minimal: 'minimalist design, clean, simple, elegant, white background',
      technical: 'technical illustration, detailed, informative, diagrams and charts'
    };

    const selectedStyle = stylePrompts[style] || stylePrompts.professional;
    const prompt = `${topic}, ${selectedStyle}, 4k resolution, perfect for blog post`;

    return await this.generateImage(prompt, {
      width: 1200,
      height: 630
    });
  }

  /**
   * Convertit l'image générée en base64
   * @param {ArrayBuffer} imageBuffer - Buffer de l'image
   * @returns {string} - Image en base64
   */
  imageToBase64(imageBuffer) {
    const bytes = new Uint8Array(imageBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Délai utilitaire
   * @param {number} ms - Millisecondes
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
