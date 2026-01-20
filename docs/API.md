# API Authentication Endpoints

Ce document décrit les endpoints d'authentification implémentés dans l'application.

## Configuration

Les variables d'environnement suivantes sont nécessaires (définies dans `.env.local`) :

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

## Endpoints

### POST /api/auth/register

Crée un nouveau compte utilisateur.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "name": "John Doe",
  "password": "password123",
  "confirm_password": "password123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "username": "johndoe",
      "name": "John Doe",
      "role": "user",
      "email_verified": false,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "last_login": null
    },
    "expires_in": 604800
  },
  "message": "User registered successfully"
}
```

### POST /api/auth/login

Connecte un utilisateur existant.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "token": "jwt_token_here",
    "user": { /* user object */ },
    "expires_in": 604800
  },
  "message": "Login successful"
}
```

### POST /api/auth/logout

Déconnecte l'utilisateur (géré principalement côté client).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

### GET /api/auth/me

Récupère les informations de l'utilisateur actuellement connecté.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": { /* user object */ }
  }
}
```

### POST /api/auth/refresh

Rafraîchit le token d'authentification.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "token": "new_jwt_token_here",
    "expires_in": 604800
  }
}
```

### POST /api/auth/forgot-password

Envoie un email de réinitialisation de mot de passe.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Note:** En mode développement, le token de réinitialisation est affiché dans la console.

### POST /api/auth/reset-password

Réinitialise le mot de passe avec un token valide.

**Request Body:**
```json
{
  "email": "user@example.com",
  "reset_token": "reset_token_here",
  "new_password": "newpassword123",
  "confirm_password": "newpassword123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Password has been reset successfully"
}
```

## Diagram Endpoints

### POST /api/diagrams/generate

Generates a system architecture diagram using the MetaSOP multi-agent orchestrator.

**Authentication:** Optional (Supports Guest sessions)

**Query Parameters:**
- `stream` (boolean, optional): If `true`, enables SSE streaming of agent thoughts and progress.

**Request Body:**
```json
{
  "prompt": "Create a microservices architecture for an e-commerce platform",
  "options": {
    "model": "gemini-3-flash-preview",
    "temperature": 0.2
  }
}
```

**Response (200 - Non-streaming):**
```json
{
  "status": "success",
  "data": {
    "id": "diag_123",
    "title": "E-commerce Platform Architecture",
    "nodes": [...],
    "edges": [...],
    "metadata": {
      "agents_involved": ["PM", "Architect", "Engineer", "Security", "QA"],
      "token_usage": 4500
    }
  }
}
```

## Security Notes

⚠️ **IMPORTANT:** Cette implémentation utilise une base de données en mémoire pour le développement. Pour la production :

1. **Remplacez la base de données** : Utilisez PostgreSQL, MongoDB, ou une autre base de données persistante
2. **Changez JWT_SECRET** : Utilisez une clé secrète forte et unique en production
3. **Implémentez l'envoi d'emails** : Pour `forgot-password`, utilisez un service d'email (SendGrid, Resend, etc.)
4. **Ajoutez rate limiting** : Protégez les endpoints contre les attaques par force brute
5. **Validez les entrées** : Ajoutez une validation plus stricte (Zod, Yup, etc.)
6. **HTTPS uniquement** : Assurez-vous que toutes les communications sont chiffrées en production

## Base de données

Actuellement, les données sont stockées en mémoire et seront perdues au redémarrage du serveur. Pour une implémentation de production, modifiez `lib/auth/db.ts` pour utiliser une vraie base de données.

