## Plano de Integração e Correções Citara

Objetivo geral: Unificar serviços (busca, IA, PDF, parsing), normalizar dados e centralizar estado para ligar UI, modais, upload e grafo de forma consistente e extensível.

### Etapas
1. Criar camada de serviços (`services/`) para Semantic Scholar, Gemini, PDF, Parser separados da UI.
2. Centralizar estado em `store.js` (projetos, artigos, citações, settings) com eventos (`dispatchEvent` / `addEventListener`).
3. Refatorar modais para usar CRUD do `store.js` (criar, editar, deletar projetos e adicionar citações/artigos).
4. Implementar pipeline de upload: PDF → metadata → regex → enriquecimento opcional via Gemini → deduplicação → persistência.
5. Normalizar modelo (autores como array de objetos `{ name: string }`, campos obrigatórios: `id`, `title`, `authors[]`, `year`, `source`, `type`, `addedAt`) e atualizar `formatter.js` + renderização dinâmica.
6. Reconstruir grafo com edges artigo → citação e persistir no `store.js`, atualizando `graph.js` em mudanças de estado.

### Considerações Futuras
1. Formato final de citação: confirmar campos adicionais (`abstract`, `doi`, `citationCount`, `confidence`, `context`).
2. Uso do Gemini: (A) gerar resumo de artigo, (B) ranking de resultados, (C) enriquecimento de citações (autores/ano faltantes).
3. Parsing PDF: manter client-side por enquanto; preparar interface para backend futuro (worker ou API).

### Ações de Normalização
- Converter qualquer formato de autores (string, objeto SemScholar) para array padronizada.
- Padronizar chaves: artigos e citações compartilham base, diferenciam `type` (`article` | `citation`).
- Persistir grafo derivado (reconstituível) para evitar inconsistências na recarga.

### Erros / Lacunas a Corrigir
- Não uso do Gemini no fluxo principal.
- Modais manipulam DOM sem refletir no estado real persistido.
- Deleção/edição de projetos não sincroniza com armazenamento central.
- Falta deduplicação robusta de citações (mesmo título/ano/autores). 
- Ausência de arestas entre artigo e citações no grafo.
- Falta tratamento de erros (fetch timeout, retry básico, validação JSON Gemini).
- Inconsistência de autores entre APIs e regex local.

### Refatoração Técnica
- Criar `services/semanticScholarService.js` (método `search(query, opts)`), `services/geminiService.js` (`enrichCitation(citation)`, `summarizeArticle(article)`), `services/pdfService.js` (`extractText(file)`), `services/parserService.js` (`extractCitations(text)`).
- Criar `store.js` com estado interno e API: `getState()`, `subscribe(event, handler)`, `addProject(data)`, `updateProject(id, data)`, `deleteProject(id)`, `addArticle(projectId, article)`, `addCitations(projectId, citations)`, `setCurrentProject(id)`, `getCurrentProject()`, `persist()`.
- Adaptar `graph.js` para consumir `store` e gerar nós/arestas derivadas.
- Adaptar `ui.js` para ouvir eventos (`project:changed`, `citations:added`, `article:added`).
- Criar util `normalizer.js` para padronizar entidades.

### Eventos Propostos
- `store:ready`
- `project:added | project:updated | project:deleted | project:current`
- `article:added`
- `citations:added`
- `settings:changed`
- `graph:updated`

### Riscos / Mitigações
- Rate limit APIs: adicionar atraso incremental e cabeçalhos de identificação.
- Performance parsing PDF: eventualmente mover para Web Worker.
- Segurança: sanitizar entradas externas antes de renderização (util já existente `escapeHTML`).
- Confiabilidade GPT/Gemini: validar JSON retornado; fallback em caso de falha sem quebrar pipeline.

### Próximo Passo
Decidir prioridade de implementação: começar por `store.js` + normalização ou serviços de API. Após confirmação, iniciar criação dos arquivos base.

(Indique prioridades / ajustes antes de executar.)
