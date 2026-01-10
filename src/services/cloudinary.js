/**
 * Service pour uploader des images vers Cloudinary
 */

export class CloudinaryService {
  constructor(cloudName, apiKey, apiSecret, uploadPreset) {
    this.cloudName = cloudName;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.uploadPreset = uploadPreset;
    this.uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  }

  /**
   * Upload une image vers Cloudinary
   * @param {ArrayBuffer|string} imageData - Image (buffer ou base64)
   * @param {object} options - Options d'upload
   * @returns {Promise<{url: string, publicId: string, secureUrl: string}>}
   */
  async uploadImage(imageData, options = {}) {
    const {
      folder = 'blog-articles',
      filename = null,
      tags = [],
      altText = '',
      context = {}
    } = options;

    try {
      // Conversion de l'image en base64 si nécessaire
      let base64Image;
      if (imageData instanceof ArrayBuffer) {
        base64Image = this.arrayBufferToBase64(imageData);
      } else {
        base64Image = imageData;
      }

      // Préparation du FormData
      const formData = new FormData();
      formData.append('file', `data:image/png;base64,${base64Image}`);
      formData.append('upload_preset', this.uploadPreset);

      if (folder) formData.append('folder', folder);
      if (filename) formData.append('public_id', filename);
      if (tags.length > 0) formData.append('tags', tags.join(','));
      if (altText) formData.append('context', `alt=${altText}`);

      // Ajout du contexte personnalisé
      if (Object.keys(context).length > 0) {
        const contextStr = Object.entries(context)
          .map(([key, value]) => `${key}=${value}`)
          .join('|');
        formData.append('context', contextStr);
      }

      // Upload
      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cloudinary upload error: ${response.status} - ${error}`);
      }

      const result = await response.json();

      return {
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Upload plusieurs images
   * @param {Array<{data: ArrayBuffer|string, options: object}>} images - Tableau d'images à uploader
   * @returns {Promise<Array>} - Résultats des uploads
   */
  async uploadMultipleImages(images) {
    const uploadPromises = images.map((img, index) =>
      this.uploadImage(img.data, {
        ...img.options,
        filename: img.options?.filename || `image-${Date.now()}-${index}`
      })
    );

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw error;
    }
  }

  /**
   * Upload les images d'un article
   * @param {ArrayBuffer[]} images - Tableaux d'images
   * @param {string} articleSlug - Slug de l'article pour l'organisation
   * @param {string[]} altTexts - Textes alternatifs pour chaque image
   * @returns {Promise<Array>}
   */
  async uploadArticleImages(images, articleSlug, altTexts = []) {
    const uploadData = images.map((imageBuffer, index) => ({
      data: imageBuffer,
      options: {
        folder: `blog-articles/${articleSlug}`,
        filename: index === 0 ? `${articleSlug}-featured` : `${articleSlug}-${index}`,
        tags: ['blog', 'auto-generated', articleSlug],
        altText: altTexts[index] || `Image ${index + 1} pour ${articleSlug}`,
        context: {
          article: articleSlug,
          position: index === 0 ? 'featured' : `content-${index}`
        }
      }
    }));

    return await this.uploadMultipleImages(uploadData);
  }

  /**
   * Convertit un ArrayBuffer en base64
   * @param {ArrayBuffer} buffer - Buffer à convertir
   * @returns {string} - Chaîne base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Génère une URL Cloudinary optimisée
   * @param {string} publicId - ID public de l'image
   * @param {object} transformations - Transformations à appliquer
   * @returns {string} - URL transformée
   */
  getOptimizedUrl(publicId, transformations = {}) {
    const {
      width = 'auto',
      quality = 'auto',
      format = 'auto',
      crop = 'fill',
      gravity = 'auto'
    } = transformations;

    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload`;
    const transform = `w_${width},q_${quality},f_${format},c_${crop},g_${gravity}`;

    return `${baseUrl}/${transform}/${publicId}`;
  }

  /**
   * Supprime une image de Cloudinary
   * @param {string} publicId - ID public de l'image à supprimer
   * @returns {Promise<object>}
   */
  async deleteImage(publicId) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await this.generateSignature(publicId, timestamp);

    try {
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('signature', signature);
      formData.append('api_key', this.apiKey);
      formData.append('timestamp', timestamp.toString());

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
        {
          method: 'POST',
          body: formData
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Génère une signature pour l'authentification Cloudinary
   * @param {string} publicId - ID public
   * @param {number} timestamp - Timestamp
   * @returns {Promise<string>} - Signature
   */
  async generateSignature(publicId, timestamp) {
    const toSign = `public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;

    // Utilisation de l'API Web Crypto pour générer le hash SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(toSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  }
}
