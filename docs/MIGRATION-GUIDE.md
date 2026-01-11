# Guide de Migration Future (TypeScript → Python si nécessaire)

Ce document décrit comment migrer vers Python si nécessaire, tout en gardant le système TypeScript actuel.

## Architecture Actuelle (TypeScript)

```
Frontend (Next.js/TypeScript)
    ↓
API Routes (TypeScript)
    ↓
MetaSOP Orchestrator (TypeScript)
    ↓
Agents (TypeScript)
```

## Architecture Hybride (Migration Progressive)

```
Frontend (Next.js/TypeScript)
    ↓
API Routes (TypeScript) - Orchestration
    ↓ HTTP/gRPC
Python Service (FastAPI) - Agents IA
    ↓
LLM APIs
```

## Points d'Extension Prévus

### 1. LLM Adapter (`lib/metasop/adapters/llm-adapter.ts`)

L'interface `LLMProvider` permet de :
- Utiliser des providers mock (actuel)
- Ajouter OpenAI/Anthropic facilement
- Remplacer par des appels Python via HTTP

**Migration :**
```typescript
// Avant (TypeScript direct)
const provider = new OpenAIProvider();

// Après (Appel Python)
const provider = new PythonLLMProvider("http://python-service:8000");
```

### 2. Configuration Centralisée (`lib/metasop/config.ts`)

La configuration permet de :
- Activer/désactiver des agents
- Configurer les timeouts
- Préparer l'intégration LLM

**Migration :**
```typescript
// Ajouter dans config
llm: {
  provider: "python-service", // Nouveau provider
  endpoint: "http://python-service:8000/api/agents"
}
```

### 3. Agents comme Services

Chaque agent peut être :
- Fonction TypeScript (actuel)
- Appel HTTP vers service Python (futur)

**Migration :**
```typescript
// Avant
const artifact = await architectAgent(context);

// Après
const artifact = await callPythonAgent("architect", context);
```

## Plan de Migration

### Phase 1 : Préparation (Maintenant)
- ✅ Interface LLM abstraite
- ✅ Configuration centralisée
- ✅ Logging structuré
- ✅ Gestion d'erreurs robuste

### Phase 2 : Service Python (Si nécessaire)
1. Créer service Python FastAPI
2. Implémenter agents en Python
3. Exposer endpoints HTTP
4. Créer adapter TypeScript pour appels Python

### Phase 3 : Migration Progressive
1. Migrer un agent à la fois
2. Tester en parallèle (TypeScript + Python)
3. Basculer progressivement
4. Retirer code TypeScript obsolète

## Code TypeScript Prêt pour Migration

### Exemple : Agent Adapter Pattern

```typescript
// lib/metasop/agents/base-agent.ts
export interface AgentAdapter {
  execute(context: AgentContext): Promise<MetaSOPArtifact>;
}

// TypeScript implementation
export class TypeScriptAgentAdapter implements AgentAdapter {
  constructor(private agentFn: (ctx: AgentContext) => Promise<MetaSOPArtifact>) {}
  
  async execute(context: AgentContext): Promise<MetaSOPArtifact> {
    return this.agentFn(context);
  }
}

// Python HTTP adapter (futur)
export class PythonAgentAdapter implements AgentAdapter {
  constructor(private endpoint: string) {}
  
  async execute(context: AgentContext): Promise<MetaSOPArtifact> {
    const response = await fetch(`${this.endpoint}/execute`, {
      method: "POST",
      body: JSON.stringify(context),
    });
    return response.json();
  }
}
```

## Avantages de Cette Approche

1. **Pas de Breaking Changes** : Le système actuel continue de fonctionner
2. **Migration Progressive** : Un agent à la fois
3. **Tests Faciles** : Comparer TypeScript vs Python
4. **Rollback Simple** : Revenir en arrière si nécessaire

## Quand Migrer vers Python ?

### Signaux pour Migration

- ✅ Besoin de RAG (Retrieval Augmented Generation)
- ✅ Vector databases (Pinecone, Weaviate)
- ✅ Fine-tuning de modèles
- ✅ Agents avec mémoire complexe
- ✅ Analyse de code avancée
- ✅ Multi-agent systems complexes

### Rester en TypeScript Si

- ✅ Génération de diagrammes simples
- ✅ Orchestration basique
- ✅ Stack unifiée importante
- ✅ Déploiement simplifié nécessaire

## Conclusion

Le système actuel est **prêt pour une migration future** si nécessaire, mais **TypeScript suffit pour l'instant**. La structure modulaire permet de migrer progressivement sans tout réécrire.

