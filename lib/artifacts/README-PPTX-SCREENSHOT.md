# Screenshot-Based PPTX Generator

## Overview

The screenshot-based PPTX generator creates PowerPoint presentations from MetaSOP artifacts by rendering HTML/CSS representations of the UI components and capturing them as images. This approach preserves the exact visual design of the web application in the exported PPTX files.

## Architecture

### Components

1. **[`screenshot-renderer.ts`](screenshot-renderer.ts)** - Core screenshot capture utility
   - Uses Puppeteer to render HTML in a headless browser
   - Captures high-resolution PNG screenshots (1920x1080)
   - Provides singleton pattern for browser instance management
   - Handles React component to HTML conversion

2. **[`html-templates.ts`](html-templates.ts)** - HTML template generators
   - Creates styled HTML for each artifact section
   - Matches the visual design of React components
   - Includes CSS styling for cards, badges, grids, etc.
   - Provides reusable template functions

3. **[`pptx-generator-screenshot.ts`](pptx-generator-screenshot.ts)** - Main PPTX generator
   - Orchestrates the screenshot capture and PPTX creation
   - Generates slides for all 7 MetaSOP agents
   - Embeds screenshots as images in PowerPoint slides
   - Maintains 16:9 aspect ratio

4. **[`route.ts`](../../app/api/diagrams/[id]/export/pptx/route.ts)** - API endpoint
   - Updated to use `PPTXGeneratorScreenshot` instead of `PPTXGenerator`
   - Handles authentication and authorization
   - Returns PPTX file as downloadable attachment

## How It Works

### 1. HTML Generation
For each artifact section (e.g., PM Overview, User Stories, Architecture Decisions), the generator:
- Extracts data from the diagram's MetaSOP artifacts
- Passes data to appropriate HTML template function
- Generates complete HTML document with inline CSS

### 2. Screenshot Capture
The screenshot renderer:
- Launches a headless Chromium browser via Puppeteer
- Sets viewport to 1920x1080 pixels
- Loads the HTML content
- Waits for rendering to complete (500ms delay)
- Captures PNG screenshot

### 3. PPTX Assembly
The PPTX generator:
- Creates a new PowerPoint presentation
- Adds title slide with project information
- For each agent (PM, Architect, Security, etc.):
  - Adds section divider slide
  - Generates HTML for each panel/tab
  - Captures screenshot
  - Embeds image in slide (full-screen, 16:9)
- Exports as binary buffer

### 4. File Download
The API endpoint:
- Receives the PPTX buffer
- Sets appropriate headers for file download
- Returns response with filename based on diagram title

## Slide Structure

### Title Slide
- Project title
- Description
- Generation timestamp

### Agent Sections (7 total)
Each agent section includes:

#### 1. Product Manager (PM)
- Section divider
- Overview (summary, vision, UI strategy)
- User Stories
- Acceptance Criteria
- INVEST Analysis
- Assumptions
- Out of Scope
- SWOT Analysis
- Gaps
- Opportunities
- Stakeholders

#### 2. Architect
- Section divider
- Architecture Overview
- API Endpoints
- Architecture Decisions
- Database Schema
- Tech Stack
- Integrations
- Security Considerations
- Scalability

#### 3. Security
- Section divider
- Security Architecture
- Threat Model
- Encryption
- Compliance

#### 4. DevOps
- Section divider
- Infrastructure
- CI/CD Pipeline
- Containerization
- Deployment Strategy
- Monitoring

#### 5. UI Designer
- Section divider
- Design Tokens
- Design Strategy
- Sitemap
- Component Library
- Atomic Design
- Blueprint
- Accessibility

#### 6. Engineer
- Section divider
- Implementation Plan
- Implementation Phases
- Technical Decisions
- Dependencies
- File Structure
- Environment Variables

#### 7. QA
- Section divider
- Test Strategy
- Test Cases
- Security Testing
- Risk Analysis
- Accessibility Testing
- Performance Testing

## Advantages

### ✅ Pros
1. **Pixel-perfect design** - Exact match to web UI
2. **Rich styling** - Preserves colors, fonts, layouts
3. **No manual formatting** - Automated visual consistency
4. **Easy maintenance** - Update HTML templates, not PPTX code
5. **Scalable** - Works for any artifact structure

### ❌ Cons
1. **Not editable** - Slides are images, not text
2. **Larger file size** - PNG images vs. text
3. **Slower generation** - Browser rendering overhead
4. **No text selection** - Can't copy/paste from slides
5. **Requires Puppeteer** - Additional dependency

## Performance Considerations

- **Browser initialization**: ~2-3 seconds (singleton pattern mitigates this)
- **Per-slide rendering**: ~500-1000ms
- **Total generation time**: ~30-60 seconds for full presentation
- **Memory usage**: ~200-300MB (Chromium browser)

## Configuration

### Image Resolution
```typescript
const IMAGE_WIDTH = 1920  // pixels
const IMAGE_HEIGHT = 1080 // pixels
```

### Slide Dimensions
```typescript
const SLIDE_WIDTH = 10      // inches
const SLIDE_HEIGHT = 5.625  // inches (16:9)
```

### Rendering Delay
```typescript
await new Promise(resolve => setTimeout(resolve, 500)) // ms
```

## Usage

### API Endpoint
```
GET /api/diagrams/[id]/export/pptx
```

### Programmatic Usage
```typescript
import { PPTXGeneratorScreenshot } from '@/lib/artifacts/pptx-generator-screenshot'

const generator = new PPTXGeneratorScreenshot(diagram)
const buffer = await generator.generate()
```

## Troubleshooting

### Issue: Puppeteer fails to launch
**Solution**: Ensure Chromium dependencies are installed
```bash
# Linux
apt-get install -y chromium-browser

# macOS
brew install chromium
```

### Issue: Screenshots are blank
**Solution**: Increase rendering delay or check HTML validity
```typescript
await new Promise(resolve => setTimeout(resolve, 1000)) // Increase to 1s
```

### Issue: Out of memory errors
**Solution**: Process slides in batches or increase Node.js memory
```bash
node --max-old-space-size=4096 your-script.js
```

### Issue: Slow generation
**Solution**: 
- Use singleton browser instance (already implemented)
- Reduce image resolution
- Skip optional slides

## Future Enhancements

1. **Hybrid approach** - Text for simple content, images for complex layouts
2. **Caching** - Cache rendered HTML for repeated exports
3. **Parallel rendering** - Render multiple slides concurrently
4. **Custom themes** - Allow users to select presentation themes
5. **Slide notes** - Add speaker notes with editable text
6. **Animation support** - Preserve Framer Motion animations as GIFs

## Migration from Text-Based Generator

The original text-based generator ([`pptx-generator.ts`](pptx-generator.ts)) is still available for comparison. Key differences:

| Feature | Text-Based | Screenshot-Based |
|---------|-----------|------------------|
| Visual fidelity | Basic | Exact match |
| File size | Small (~100KB) | Large (~5-10MB) |
| Generation time | Fast (~5s) | Slow (~60s) |
| Editability | Full | None |
| Maintenance | Manual formatting | HTML templates |

## Dependencies

```json
{
  "puppeteer": "^24.36.1",
  "pptxgenjs": "^4.0.1",
  "react": "19.2.0",
  "react-dom": "19.2.0"
}
```

## License

Part of the MetaSOP project. See main LICENSE file.
