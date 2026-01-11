const crypto = require('crypto');

// Generate a secure random JWT secret (64 bytes = 128 hex characters)
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('\n✅ JWT_SECRET généré avec succès!\n');
console.log('Ajoutez cette ligne à votre fichier .env.local :\n');
console.log(`JWT_SECRET=${jwtSecret}\n`);
console.log('⚠️  IMPORTANT: Gardez ce secret en sécurité et ne le partagez jamais!\n');

