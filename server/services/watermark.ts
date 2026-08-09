import fs from 'fs';
import path from 'path';

/**
 * Creates SVG or Data URI based watermarked previews and thumbnails for uploaded photos.
 */
export class WatermarkService {
  /**
   * Generates a watermarked SVG overlay for a photo image URL or Data URI.
   */
  static generateWatermarkedSvgUrl(
    imageSrc: string,
    watermarkText: string = 'DPHOTO - COMPRA PROTEGIDA',
    width: number = 800,
    height: number = 600
  ): string {
    const safeText = watermarkText.replace(/</g, '&lt;').replace(/>/g, '&gt;').toUpperCase();
    
    // Create an SVG with embedded pattern overlay and diagonal watermark text
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        </pattern>
      </defs>
      <!-- Base Image -->
      <image href="${imageSrc}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
      
      <!-- Semi-transparent Grid Overlay -->
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      <!-- Repeated Diagonal Watermark Lines -->
      <g transform="rotate(-30 ${width / 2} ${height / 2})" fill="rgba(255,255,255,0.45)" font-family="Arial, sans-serif" font-weight="900" font-size="${Math.max(16, width / 25)}">
        <text x="5%" y="20%" text-anchor="middle" letter-spacing="4">${safeText}</text>
        <text x="50%" y="20%" text-anchor="middle" letter-spacing="4">${safeText}</text>
        <text x="95%" y="20%" text-anchor="middle" letter-spacing="4">${safeText}</text>
        
        <text x="-15%" y="50%" text-anchor="middle" letter-spacing="4">${safeText}</text>
        <text x="35%" y="50%" text-anchor="middle" letter-spacing="4">${safeText}</text>
        <text x="85%" y="50%" text-anchor="middle" letter-spacing="4">${safeText}</text>
        
        <text x="10%" y="80%" text-anchor="middle" letter-spacing="4">${safeText}</text>
        <text x="60%" y="80%" text-anchor="middle" letter-spacing="4">${safeText}</text>
        <text x="110%" y="80%" text-anchor="middle" letter-spacing="4">${safeText}</text>
      </g>
      
      <!-- Center High-Contrast Badge -->
      <rect x="${width / 2 - 180}" y="${height / 2 - 22}" width="360" height="44" rx="8" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.3)" stroke-width="1" />
      <text x="${width / 2}" y="${height / 2 + 6}" fill="#ffffff" font-family="Arial, sans-serif" font-weight="bold" font-size="16" text-anchor="middle" letter-spacing="2">
        🔒 ${safeText}
      </text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /**
   * Generates a sample placeholder photo image with realistic sports/event imagery colors
   */
  static generateSamplePhotoDataUrl(
    text: string,
    bgColor: string = '#1e293b',
    textColor: string = '#f8fafc',
    width: number = 800,
    height: number = 600
  ): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgColor}" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGrad)"/>
      <circle cx="${width * 0.3}" cy="${height * 0.4}" r="${width * 0.2}" fill="rgba(255,255,255,0.05)"/>
      <circle cx="${width * 0.7}" cy="${height * 0.6}" r="${width * 0.25}" fill="rgba(59,130,246,0.1)"/>
      <path d="M 0 ${height * 0.7} Q ${width * 0.5} ${height * 0.4} ${width} ${height * 0.8} L ${width} ${height} L 0 ${height} Z" fill="rgba(255,255,255,0.03)" />
      
      <text x="50%" y="45%" fill="${textColor}" font-family="Arial, sans-serif" font-weight="bold" font-size="32" text-anchor="middle">
        📷 ${text}
      </text>
      <text x="50%" y="55%" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" font-size="16" text-anchor="middle">
        Alta Resolução - Original Protegido
      </text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}
