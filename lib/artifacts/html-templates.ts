/**
 * HTML template generators for artifact sections
 * These templates match the styling of the React components
 */

const baseStyles = `
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
    background: #f9fafb;
    padding: 2rem;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
  }

  .card {
    background: white;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    margin-bottom: 1.5rem;
  }
  
  .card-header {
    padding: 1.5rem 1.5rem 0.75rem;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .card-content {
    padding: 1.5rem;
  }
  
  .card-title {
    font-size: 1.125rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #111827;
  }

  .icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid;
  }

  .badge-blue {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #1e40af;
  }

  .badge-green {
    background: #f0fdf4;
    border-color: #22c55e;
    color: #15803d;
  }

  .badge-orange {
    background: #fff7ed;
    border-color: #f97316;
    color: #c2410c;
  }

  .badge-purple {
    background: #faf5ff;
    border-color: #a855f7;
    color: #7e22ce;
  }

  .badge-red {
    background: #fef2f2;
    border-color: #ef4444;
    color: #b91c1c;
  }

  .text-muted {
    color: #6b7280;
  }

  .text-sm {
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .text-xs {
    font-size: 0.75rem;
    line-height: 1.5;
  }

  .grid {
    display: grid;
    gap: 1.5rem;
  }

  .grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .space-y-4 > * + * {
    margin-top: 1rem;
  }

  .space-y-2 > * + * {
    margin-top: 0.5rem;
  }

  .list-item {
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .list-item-title {
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .list-item-description {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #111827;
    margin-bottom: 1.5rem;
  }

  .highlight-box {
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid;
  }

  .highlight-blue {
    background: #eff6ff;
    border-color: #93c5fd;
  }

  .highlight-green {
    background: #f0fdf4;
    border-color: #86efac;
  }

  .highlight-orange {
    background: #fff7ed;
    border-color: #fdba74;
  }

  .highlight-red {
    background: #fef2f2;
    border-color: #fca5a5;
  }

  ul {
    list-style-position: inside;
    padding-left: 1rem;
  }

  li {
    margin-bottom: 0.5rem;
    color: #4b5563;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    background: #f9fafb;
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    border-bottom: 2px solid #e5e7eb;
  }

  td {
    padding: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
    font-size: 0.875rem;
  }

  code {
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: 'Courier New', monospace;
    font-size: 0.875em;
  }
`;

export function wrapInHTML(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
  `.trim();
}

export function createSectionDivider(title: string, subtitle?: string): string {
  return wrapInHTML(title, `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 80vh; text-align: center;">
      <h1 style="font-size: 3.5rem; font-weight: 800; color: #111827; margin-bottom: 1rem;">${title}</h1>
      ${subtitle ? `<p style="font-size: 1.5rem; color: #6b7280;">${subtitle}</p>` : ''}
    </div>
  `);
}

export function createOverviewSlide(data: any): string {
  const content = `
    <h2 class="section-title">Overview</h2>
    
    ${data.summary ? `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <span class="icon" style="color: #3b82f6;">ℹ️</span>
          Strategic Summary
        </h3>
      </div>
      <div class="card-content">
        <p class="text-sm text-muted">${data.summary}</p>
      </div>
    </div>
    ` : ''}

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <span class="icon" style="color: #f97316;">🗺️</span>
          Product Vision
        </h3>
      </div>
      <div class="card-content">
        <p class="text-sm">${data.description || 'The product vision and high-level strategy for this implementation.'}</p>
      </div>
    </div>

    ${data.ui_multi_section !== undefined ? `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <span class="icon" style="color: #a855f7;">📐</span>
          UI Architecture Strategy
        </h3>
      </div>
      <div class="card-content">
        <div class="highlight-box highlight-blue">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.75rem; text-transform: uppercase; color: #6b7280; font-weight: 700; margin-bottom: 0.25rem;">Navigation Pattern</div>
              <div style="font-size: 1rem; font-weight: 700; color: #111827;">${data.ui_multi_section ? 'Multi-Section (Sidebar/Tabs)' : 'Single-View Experience'}</div>
            </div>
            <span class="badge ${data.ui_multi_section ? 'badge-purple' : 'badge-orange'}">${data.ui_multi_section ? 'COMPLEX' : 'LITE'}</span>
          </div>
        </div>
      </div>
    </div>
    ` : ''}
  `;

  return wrapInHTML('Overview', content);
}

export function createUserStoriesSlide(userStories: any[]): string {
  const storiesHTML = userStories.map((story, idx) => `
    <div class="list-item">
      <div class="list-item-title">
        <span class="badge badge-blue">US-${idx + 1}</span>
        ${story.title || story.story}
      </div>
      ${story.description ? `<div class="list-item-description">${story.description}</div>` : ''}
      ${story.acceptance_criteria && story.acceptance_criteria.length > 0 ? `
        <div style="margin-top: 0.75rem;">
          <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem;">Acceptance Criteria:</div>
          <ul>
            ${story.acceptance_criteria.map((ac: string) => `<li>${ac}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('');

  const content = `
    <h2 class="section-title">User Stories</h2>
    <div class="space-y-4">
      ${storiesHTML}
    </div>
  `;

  return wrapInHTML('User Stories', content);
}

export function createListSlide(title: string, items: any[], itemRenderer: (item: any, idx: number) => string): string {
  const itemsHTML = items.map((item, idx) => itemRenderer(item, idx)).join('');

  const content = `
    <h2 class="section-title">${title}</h2>
    <div class="space-y-4">
      ${itemsHTML}
    </div>
  `;

  return wrapInHTML(title, content);
}

export function createTableSlide(title: string, headers: string[], rows: string[][]): string {
  const content = `
    <h2 class="section-title">${title}</h2>
    <div class="card">
      <div class="card-content">
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return wrapInHTML(title, content);
}

export function createSWOTSlide(swot: any): string {
  const content = `
    <h2 class="section-title">SWOT Analysis</h2>
    <div class="grid grid-2">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span class="icon" style="color: #22c55e;">💪</span>
            Strengths
          </h3>
        </div>
        <div class="card-content">
          <ul>
            ${(swot.strengths || []).map((s: string) => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span class="icon" style="color: #ef4444;">⚠️</span>
            Weaknesses
          </h3>
        </div>
        <div class="card-content">
          <ul>
            ${(swot.weaknesses || []).map((w: string) => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span class="icon" style="color: #3b82f6;">🎯</span>
            Opportunities
          </h3>
        </div>
        <div class="card-content">
          <ul>
            ${(swot.opportunities || []).map((o: string) => `<li>${o}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span class="icon" style="color: #f97316;">🚨</span>
            Threats
          </h3>
        </div>
        <div class="card-content">
          <ul>
            ${(swot.threats || []).map((t: string) => `<li>${t}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;

  return wrapInHTML('SWOT Analysis', content);
}

export function createTextContentSlide(title: string, content: string | string[]): string {
  const contentHTML = Array.isArray(content)
    ? `<ul>${content.map(item => `<li>${item}</li>`).join('')}</ul>`
    : `<p class="text-sm">${content}</p>`;

  const html = `
    <h2 class="section-title">${title}</h2>
    <div class="card">
      <div class="card-content">
        ${contentHTML}
      </div>
    </div>
  `;

  return wrapInHTML(title, html);
}

export function createKeyValueSlide(title: string, data: Record<string, any>): string {
  const itemsHTML = Object.entries(data).map(([key, value]) => {
    const displayValue = typeof value === 'object' 
      ? JSON.stringify(value, null, 2)
      : String(value);

    return `
      <div class="list-item">
        <div class="list-item-title">${key}</div>
        <div class="list-item-description">${displayValue}</div>
      </div>
    `;
  }).join('');

  const content = `
    <h2 class="section-title">${title}</h2>
    <div class="space-y-4">
      ${itemsHTML}
    </div>
  `;

  return wrapInHTML(title, content);
}
