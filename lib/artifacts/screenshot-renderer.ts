import puppeteer, { Browser, Page } from 'puppeteer';
import { renderToString } from 'react-dom/server';
import * as React from 'react';

/**
 * Screenshot renderer for converting React components to images
 * for use in PPTX generation
 */
export class ScreenshotRenderer {
  private browser: Browser | null = null;

  /**
   * Initialize the Puppeteer browser instance
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
    }
  }

  /**
   * Close the browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Render a React component to an image buffer
   * @param component - React component to render
   * @param width - Width of the screenshot in pixels
   * @param height - Height of the screenshot in pixels
   * @returns Buffer containing the PNG image
   */
  async renderComponentToImage(
    component: React.ReactElement,
    width: number = 1920,
    height: number = 1080
  ): Promise<Buffer> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    
    try {
      // Set viewport size
      await page.setViewport({ width, height });

      // Render React component to HTML string
      const html = this.wrapComponentInHTML(component);

      // Set the page content
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // Wait for any animations or dynamic content
      await new Promise(resolve => setTimeout(resolve, 500));

      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width,
          height
        }
      });

      return screenshot as Buffer;
    } finally {
      await page.close();
    }
  }

  /**
   * Render HTML content directly to an image buffer
   * @param html - HTML string to render
   * @param width - Width of the screenshot in pixels
   * @param height - Height of the screenshot in pixels
   * @returns Buffer containing the PNG image
   */
  async renderHTMLToImage(
    html: string,
    width: number = 1920,
    height: number = 1080
  ): Promise<Buffer> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    
    try {
      // Set viewport size
      await page.setViewport({ width, height });

      // Set the page content
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // Wait for any animations or dynamic content
      await new Promise(resolve => setTimeout(resolve, 500));

      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width,
          height
        }
      });

      return screenshot as Buffer;
    } finally {
      await page.close();
    }
  }

  /**
   * Wrap a React component in a complete HTML document with Tailwind CSS
   * @param component - React component to wrap
   * @returns Complete HTML string
   */
  private wrapComponentInHTML(component: React.ReactElement): string {
    const componentHTML = renderToString(component);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artifact Screenshot</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: #ffffff;
      padding: 2rem;
    }

    /* Tailwind-like utility classes */
    .text-muted-foreground { color: #6b7280; }
    .text-foreground { color: #111827; }
    .bg-muted { background-color: #f3f4f6; }
    .bg-card { background-color: #ffffff; }
    .border { border: 1px solid #e5e7eb; }
    .border-border { border-color: #e5e7eb; }
    .rounded-xl { border-radius: 0.75rem; }
    .rounded { border-radius: 0.25rem; }
    .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
    .space-y-6 > * + * { margin-top: 1.5rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-6 { gap: 1.5rem; }
    .p-3 { padding: 0.75rem; }
    .p-2 { padding: 0.5rem; }
    .leading-relaxed { line-height: 1.625; }
    
    /* Card styles */
    .card {
      background: white;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }
    
    .card-header {
      padding: 1.5rem 1.5rem 0;
    }
    
    .card-content {
      padding: 1.5rem;
    }
    
    .card-title {
      font-size: 0.875rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Badge styles */
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid;
    }

    /* Grid */
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    
    @media (min-width: 768px) {
      .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  ${componentHTML}
</body>
</html>
    `.trim();
  }

  /**
   * Create a simple HTML slide for text content
   * @param title - Slide title
   * @param content - Slide content (can be HTML)
   * @param width - Width in pixels
   * @param height - Height in pixels
   * @returns Buffer containing the PNG image
   */
  async createTextSlide(
    title: string,
    content: string,
    width: number = 1920,
    height: number = 1080
  ): Promise<Buffer> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      padding: 4rem;
      height: 100vh;
      color: white;
    }

    h1 {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 2rem;
      line-height: 1.2;
    }

    .content {
      font-size: 1.5rem;
      line-height: 1.8;
      max-width: 80%;
      background: rgba(255, 255, 255, 0.1);
      padding: 2rem;
      border-radius: 1rem;
      backdrop-filter: blur(10px);
    }

    .content p {
      margin-bottom: 1rem;
    }

    .content ul {
      list-style-position: inside;
      margin-left: 1rem;
    }

    .content li {
      margin-bottom: 0.5rem;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="content">
    ${content}
  </div>
</body>
</html>
    `.trim();

    return this.renderHTMLToImage(html, width, height);
  }
}

// Singleton instance
let rendererInstance: ScreenshotRenderer | null = null;

/**
 * Get or create the singleton screenshot renderer instance
 */
export async function getScreenshotRenderer(): Promise<ScreenshotRenderer> {
  if (!rendererInstance) {
    rendererInstance = new ScreenshotRenderer();
    await rendererInstance.initialize();
  }
  return rendererInstance;
}

/**
 * Clean up the screenshot renderer instance
 */
export async function closeScreenshotRenderer(): Promise<void> {
  if (rendererInstance) {
    await rendererInstance.close();
    rendererInstance = null;
  }
}
