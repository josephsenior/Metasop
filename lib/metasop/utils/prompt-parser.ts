/**
 * Utility to parse and extract information from user prompts
 */

export interface ParsedPrompt {
  keywords: string[];
  hasAuth: boolean;
  hasDatabase: boolean;
  hasAPI: boolean;
  hasPayment: boolean;
  hasEmail: boolean;
  hasStorage: boolean;
  hasStateManagement: boolean;
  components: string[];
  technologies: string[];
}

/**
 * Parse user prompt to extract key information
 */
export function parsePrompt(prompt: string): ParsedPrompt {
  const lower = prompt.toLowerCase();

  const keywords = lower
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 20);

  return {
    keywords,
    hasAuth: /auth|login|register|user|account|session/i.test(prompt),
    hasDatabase: /database|db|data|store|save|persist/i.test(prompt),
    hasAPI: /api|endpoint|rest|graphql|service/i.test(prompt),
    hasPayment: /payment|pay|stripe|paypal|billing|checkout/i.test(prompt),
    hasEmail: /email|mail|notification|send|message/i.test(prompt),
    hasStorage: /storage|file|upload|s3|bucket|blob/i.test(prompt),
    hasStateManagement: /state|redux|zustand|context|store/i.test(prompt),
    components: extractComponents(prompt),
    technologies: extractTechnologies(prompt),
  };
}

function extractComponents(prompt: string): string[] {
  const components: string[] = [];

  if (/dashboard|admin|panel/i.test(prompt)) components.push("Dashboard");
  if (/form|input|submit/i.test(prompt)) components.push("Form");
  if (/list|table|grid/i.test(prompt)) components.push("List");
  if (/chart|graph|visualization/i.test(prompt)) components.push("Chart");
  if (/modal|dialog|popup/i.test(prompt)) components.push("Modal");
  if (/search|filter/i.test(prompt)) components.push("Search");

  return components;
}

function extractTechnologies(prompt: string): string[] {
  const technologies: string[] = [];
  const lower = prompt.toLowerCase();

  const techMap: Record<string, string> = {
    react: "React",
    next: "Next.js",
    vue: "Vue",
    angular: "Angular",
    node: "Node.js",
    express: "Express",
    nest: "NestJS",
    python: "Python",
    django: "Django",
    flask: "Flask",
    postgres: "PostgreSQL",
    mysql: "MySQL",
    mongodb: "MongoDB",
    redis: "Redis",
    docker: "Docker",
    kubernetes: "Kubernetes",
    aws: "AWS",
    azure: "Azure",
    gcp: "GCP",
  };

  for (const [key, value] of Object.entries(techMap)) {
    if (lower.includes(key)) {
      technologies.push(value);
    }
  }

  return technologies;
}

