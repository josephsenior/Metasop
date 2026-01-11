export interface PromptTemplate {
  id: string
  title: string
  description: string
  category: string
  prompt: string
  tags: string[]
  icon?: string
}

export const promptTemplates: PromptTemplate[] = [
  // E-commerce Templates
  {
    id: "ecommerce-basic",
    title: "E-commerce Platform",
    description: "Complete online store with products, cart, checkout, and payments",
    category: "E-commerce",
    prompt: "Create an e-commerce platform with user authentication, product catalog with categories and search, shopping cart, secure checkout with payment processing (Stripe integration), order management, user profiles, product reviews and ratings, inventory management, and admin dashboard. Use React for frontend, Node.js/Express for backend, PostgreSQL for database, and Redis for caching.",
    tags: ["React", "Node.js", "PostgreSQL", "Stripe", "E-commerce"]
  },
  {
    id: "ecommerce-marketplace",
    title: "Multi-vendor Marketplace",
    description: "Platform where multiple sellers can list and sell products",
    category: "E-commerce",
    prompt: "Build a multi-vendor marketplace platform where sellers can register, create stores, list products, manage inventory, and process orders. Include buyer features like browsing, search, filtering, reviews, and secure payments. Add admin panel for platform management, commission tracking, seller verification, and analytics. Use microservices architecture with separate services for vendors, products, orders, and payments.",
    tags: ["Microservices", "Multi-vendor", "Marketplace", "E-commerce"]
  },

  // SaaS Templates
  {
    id: "saas-crm",
    title: "CRM System",
    description: "Customer relationship management with contacts, deals, and analytics",
    category: "SaaS",
    prompt: "Design a CRM (Customer Relationship Management) system with contact management, lead tracking, deal pipeline, task management, email integration, calendar scheduling, reporting and analytics dashboard, team collaboration features, custom fields, and API integrations. Use React/TypeScript frontend, Node.js backend, PostgreSQL database, and real-time updates with WebSockets.",
    tags: ["CRM", "SaaS", "Analytics", "WebSockets"]
  },
  {
    id: "saas-project-management",
    title: "Project Management Tool",
    description: "Team collaboration with tasks, boards, timelines, and reporting",
    category: "SaaS",
    prompt: "Create a project management platform with kanban boards, task management, team collaboration, time tracking, file sharing, project timelines (Gantt charts), reporting dashboard, notifications, integrations with Slack/GitHub, and role-based access control. Use React frontend, Node.js backend, MongoDB for flexible data structure, and Redis for real-time updates.",
    tags: ["Project Management", "Kanban", "Collaboration", "SaaS"]
  },
  {
    id: "saas-analytics",
    title: "Analytics Dashboard",
    description: "Data visualization and analytics platform with custom reports",
    category: "SaaS",
    prompt: "Build an analytics dashboard platform that allows users to connect data sources (APIs, databases, CSV files), create custom dashboards with various chart types (line, bar, pie, heatmaps), set up automated reports, configure alerts, and share dashboards with team members. Include data transformation tools, scheduled data refreshes, and export capabilities. Use React with D3.js/Chart.js, Python FastAPI backend, PostgreSQL for metadata, and data warehouse for analytics.",
    tags: ["Analytics", "Dashboard", "Data Visualization", "SaaS"]
  },

  // Social Media Templates
  {
    id: "social-media-basic",
    title: "Social Media Platform",
    description: "Social network with posts, comments, likes, and real-time feed",
    category: "Social Media",
    prompt: "Create a social media platform with user profiles, posts with images/videos, comments, likes, shares, real-time feed algorithm, follow/unfollow system, direct messaging, notifications, hashtags, trending topics, and content moderation. Use React frontend, Node.js backend with GraphQL API, PostgreSQL for relational data, Redis for caching, and WebSockets for real-time features.",
    tags: ["Social Media", "Real-time", "GraphQL", "WebSockets"]
  },
  {
    id: "social-media-community",
    title: "Community Forum",
    description: "Discussion forum with topics, threads, moderation, and reputation",
    category: "Social Media",
    prompt: "Build a community forum platform with categories, topics, threaded discussions, upvote/downvote system, user reputation, badges, moderation tools, search functionality, email notifications, and rich text editor. Include admin panel for community management. Use Next.js for SSR, Node.js backend, PostgreSQL database, and Elasticsearch for search.",
    tags: ["Forum", "Community", "Discussion", "Social"]
  },

  // API & Backend Templates
  {
    id: "api-rest",
    title: "REST API Service",
    description: "RESTful API with authentication, rate limiting, and documentation",
    category: "API & Backend",
    prompt: "Design a RESTful API service with JWT authentication, role-based access control, rate limiting, request validation, comprehensive API documentation (OpenAPI/Swagger), error handling, logging, monitoring, versioning, and webhook support. Include database migrations, caching layer, and background job processing. Use Node.js/Express or Python FastAPI, PostgreSQL, Redis, and Docker for deployment.",
    tags: ["REST API", "Authentication", "Documentation", "Backend"]
  },
  {
    id: "api-microservices",
    title: "Microservices Architecture",
    description: "Distributed system with multiple services, API gateway, and service mesh",
    category: "API & Backend",
    prompt: "Create a microservices architecture with API gateway, service discovery, authentication service, user service, product service, order service, notification service, and payment service. Include inter-service communication (gRPC/REST), distributed tracing, centralized logging, circuit breakers, load balancing, and container orchestration. Use Docker, Kubernetes, message queue (RabbitMQ/Kafka), and service mesh (Istio).",
    tags: ["Microservices", "Kubernetes", "gRPC", "Distributed Systems"]
  },

  // Content Management Templates
  {
    id: "cms-headless",
    title: "Headless CMS",
    description: "Content management API with rich editor and media management",
    category: "Content Management",
    prompt: "Build a headless CMS with content types, rich text editor, media library, content versioning, draft/publish workflow, content scheduling, multi-language support, content API (REST/GraphQL), webhooks, and role-based permissions. Include admin dashboard for content management. Use Node.js backend, PostgreSQL for content storage, S3 for media files, and Elasticsearch for content search.",
    tags: ["CMS", "Headless", "Content Management", "API"]
  },
  {
    id: "cms-blog",
    title: "Blog Platform",
    description: "Modern blog with posts, categories, tags, and SEO optimization",
    category: "Content Management",
    prompt: "Create a blog platform with post creation/editing (Markdown support), categories and tags, SEO optimization, RSS feeds, comments system, author profiles, search functionality, related posts, and analytics. Include admin panel for content management. Use Next.js for SSR and SEO, Node.js backend, PostgreSQL database, and CDN for static assets.",
    tags: ["Blog", "CMS", "SEO", "Next.js"]
  },

  // FinTech Templates
  {
    id: "fintech-payment",
    title: "Payment Processing System",
    description: "Secure payment gateway with transactions, refunds, and reporting",
    category: "FinTech",
    prompt: "Design a payment processing system with payment gateway integration (Stripe/PayPal), transaction management, refund processing, subscription billing, invoice generation, payment analytics, fraud detection, PCI compliance, webhook handling, and merchant dashboard. Use Node.js backend, PostgreSQL for transactions, Redis for rate limiting, and secure encryption for sensitive data.",
    tags: ["Payments", "FinTech", "Security", "Transactions"]
  },
  {
    id: "fintech-banking",
    title: "Digital Banking App",
    description: "Banking application with accounts, transfers, and financial tracking",
    category: "FinTech",
    prompt: "Build a digital banking application with account management, balance tracking, money transfers, transaction history, bill payments, savings goals, budgeting tools, financial analytics, push notifications, biometric authentication, and compliance with banking regulations. Use React Native for mobile, Node.js backend, PostgreSQL database, and secure encryption for all financial data.",
    tags: ["Banking", "FinTech", "Mobile", "Security"]
  },

  // Healthcare Templates
  {
    id: "healthcare-telemedicine",
    title: "Telemedicine Platform",
    description: "Virtual healthcare with appointments, video calls, and prescriptions",
    category: "Healthcare",
    prompt: "Create a telemedicine platform with patient registration, doctor profiles, appointment scheduling, video consultations, prescription management, medical records, billing, insurance integration, HIPAA compliance, secure messaging, and patient portal. Use React frontend, Node.js backend, PostgreSQL for medical records, and WebRTC for video calls.",
    tags: ["Healthcare", "Telemedicine", "HIPAA", "Video Calls"]
  },
  {
    id: "healthcare-emr",
    title: "Electronic Medical Records",
    description: "EMR system with patient records, appointments, and clinical notes",
    category: "Healthcare",
    prompt: "Design an Electronic Medical Records (EMR) system with patient management, medical history, clinical notes, appointment scheduling, lab results, medication management, billing, insurance claims, HIPAA compliance, audit logs, and reporting. Include role-based access for doctors, nurses, and administrators. Use React frontend, Node.js backend, PostgreSQL database, and secure data encryption.",
    tags: ["Healthcare", "EMR", "HIPAA", "Medical Records"]
  },

  // Education Templates
  {
    id: "education-lms",
    title: "Learning Management System",
    description: "Online learning platform with courses, assignments, and progress tracking",
    category: "Education",
    prompt: "Build a Learning Management System (LMS) with course creation, video lessons, assignments, quizzes, student progress tracking, certificates, discussion forums, live classes, payment integration, and instructor dashboard. Include mobile app for students. Use React frontend, Node.js backend, PostgreSQL database, video streaming (AWS MediaConvert), and file storage (S3).",
    tags: ["Education", "LMS", "E-learning", "Courses"]
  },
  {
    id: "education-online-classroom",
    title: "Online Classroom",
    description: "Virtual classroom with live sessions, whiteboard, and collaboration",
    category: "Education",
    prompt: "Create an online classroom platform with live video sessions, interactive whiteboard, screen sharing, breakout rooms, chat, polls, attendance tracking, recording, and assignment submission. Include teacher and student dashboards. Use React frontend, Node.js backend, WebRTC for video, Socket.io for real-time collaboration, and PostgreSQL for data storage.",
    tags: ["Education", "Video", "Collaboration", "WebRTC"]
  },

  // Real Estate Templates
  {
    id: "realestate-listings",
    title: "Property Listing Platform",
    description: "Real estate marketplace with property search, filters, and virtual tours",
    category: "Real Estate",
    prompt: "Design a property listing platform with property search with advanced filters, map integration, virtual tours, saved searches, property comparisons, agent profiles, inquiry system, mortgage calculator, and admin panel for property management. Use React frontend, Node.js backend, PostgreSQL database, Google Maps API, and image storage (S3).",
    tags: ["Real Estate", "Listings", "Maps", "Search"]
  },

  // Food & Delivery Templates
  {
    id: "food-delivery",
    title: "Food Delivery App",
    description: "Food ordering platform with restaurants, cart, and real-time tracking",
    category: "Food & Delivery",
    prompt: "Build a food delivery platform with restaurant listings, menu browsing, cart management, order placement, real-time order tracking, payment processing, delivery driver app, restaurant dashboard, customer reviews, and admin panel. Use React Native for mobile apps, Node.js backend, PostgreSQL database, real-time location tracking, and push notifications.",
    tags: ["Food Delivery", "Mobile", "Real-time", "E-commerce"]
  },

  // Travel Templates
  {
    id: "travel-booking",
    title: "Travel Booking Platform",
    description: "Hotel and flight booking with search, filters, and reservations",
    category: "Travel",
    prompt: "Create a travel booking platform with hotel and flight search, advanced filters, price comparison, booking management, payment processing, email confirmations, user reviews, loyalty program, and admin dashboard. Include integration with third-party APIs (Amadeus, Booking.com). Use React frontend, Node.js backend, PostgreSQL database, and Redis for caching search results.",
    tags: ["Travel", "Booking", "Hotels", "Flights"]
  }
]

export const templateCategories = [
  "All",
  "E-commerce",
  "SaaS",
  "Social Media",
  "API & Backend",
  "Content Management",
  "FinTech",
  "Healthcare",
  "Education",
  "Real Estate",
  "Food & Delivery",
  "Travel"
]

export const getTemplatesByCategory = (category: string): PromptTemplate[] => {
  if (category === "All") {
    return promptTemplates
  }
  return promptTemplates.filter(template => template.category === category)
}

export const getTemplateById = (id: string): PromptTemplate | undefined => {
  return promptTemplates.find(template => template.id === id)
}

