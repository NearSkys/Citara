**Sistema de Citação Acadêmica com Grafos Especificação Completa de Requisitos (HTML \+ CSS \+ JS \+ JSON)** 

 **Documento Estratégico** 

**Projeto:** Sistema Inteligente de Citação Acadêmica com Análise de Grafos **Escopo:** Frontend puro (HTML, CSS, JavaScript, JSON) 

**Objetivo:** Ganhar bolsa FIAP (Alura \+ FIAP) 

**Público:** Pesquisadores e acadêmicos 

**Duração Esperada:** 3-4 semanas de desenvolvimento 

**1\. REQUISITOS FUNCIONAIS** 

**1.1 Gerenciamento de Projetos de Pesquisa** 

**RF 1.1.1 \- Criar Novo Projeto** 

\[ \] Usuário pode criar um novo projeto de pesquisa com nome, descrição e tags \[ \] Cada projeto armazena: título, descrição, data criação, cor temática \[ \] Suportar múltiplos projetos simultâneos 

\[ \] Armazenar em JSON local (LocalStorage ou download) 

**RF 1.1.2 \- Listar e Selecionar Projetos** 

\[ \] Dashboard mostra cards de todos os projetos 

\[ \] Click em projeto carrega seu contexto completo 

\[ \] Opções: renomear, duplicar, deletar, exportar projeto 

\[ \] Indicador visual: número de citações por projeto 

**RF 1.1.3 \- Importar/Exportar Projetos** 

\[ \] Download projeto como arquivo JSON com todos os dados 

\[ \] Upload arquivo JSON para restaurar projeto completo 

\[ \] Validação de integridade do JSON  
**1.2 Importação e Análise de Artigos** 

**RF 1.2.1 \- Upload de Artigos** 

\[ \] Aceitar upload de **PDF** (via FileReader API do JS) 

\[ \] Extrair texto do PDF usando biblioteca JS (pdfjs) 

\[ \] Aceitar também **texto colado** (colar conteúdo diretamente) 

\[ \] Aceitar URL e fazer fetch do conteúdo (CORS-compatible) 

\[ \] Feedback visual durante processamento 

**RF 1.2.2 \- Visualização do Texto Extraído** 

\[ \] Mostrar texto completo em painel scrollável 

\[ \] Highlight de trechos com diferentes cores 

\[ \] Permitir seleção de texto para ações rápidas 

\[ \] Metadados exibidos: número de palavras, parágrafos, estimativa de tempo leitura **RF 1.2.3 \- Processamento Inicial de Artigo** 

\[ \] Detectar estrutura: título, autores, resumo, seções principais 

\[ \] Parsing automático de metadados (regex patterns): 

Título: primeira linha em CAPS ou topo 

Autores: padrão "Author, A., Author, B. (YEAR)" 

Ano: buscar ano entre parênteses ou em informações de publicação \[ \] Armazenar artigo com metadados em JSON 

**RF 1.2.4 \- Visualização de Artigos Carregados** 

\[ \] Lista lateral mostra todos os artigos do projeto 

\[ \] Para cada artigo: título, autores, ano, número de citações extraídas \[ \] Click rápido para trocar entre artigos 

\[ \] Indicador visual de artigo ativo 

**1.3 Extração de Citações (Multi-Abordagem)** 

**RF 1.3.1 \- Extração Automática com Regex & Padrões** 

\[ \] Detectar padrões de citação comuns: 

`Author (Year)` → Smith (2020) 

`(Author, Year)` → (Smith, 2020\) 

`Author et al. (Year)` → Smith et al. (2020) 

`[Author, Year]` → \[Smith, 2020\] 

Citações numéricas: `[1]`, `(1)`, `¹`  
\[ \] Extrair contexto: sentença onde citação aparece 

\[ \] Score de confiança para cada extração (0-100) 

\[ \] Sugerir automaticamente ao usuário "citações encontradas" **RF 1.3.2 \- Sugestão e Validação de Citações** 

\[ \] Listar citações detectadas automaticamente 

\[ \] Checkbox: usuário aprova/rejeita cada sugestão 

\[ \] Ao aprovar, permitir editar campos (completar autor, título, etc) \[ \] Campo de "confiança" mostrando qualidade da extração 

**RF 1.3.3 \- Adição Manual de Citações** 

\[ \] Formulário para adicionar citação manual: 

Autores (suporta múltiplos) 

Título 

Ano 

Tipo de documento (Journal, Conference, Book, Preprint, Website, etc) DOI (opcional) 

URL (opcional) 

Página/Volume/Issue (opcional) 

Notas pessoais 

\[ \] Validação básica (ex: ano entre 1900-2100, DOI format) 

\[ \] Auto-salvamento em JSON 

**RF 1.3.4 \- Edição de Citações** 

\[ \] Click em citação existente abre modal de edição 

\[ \] Modificar qualquer campo 

\[ \] Atualizar em tempo real no JSON 

\[ \] Histórico de mudanças (backup anterior) 

**RF 1.3.5 \- Marcação de Contexto** 

\[ \] Para cada citação, permitir adicionar: 

Contexto: trecho do texto onde foi citada 

Função: "Background", "Método", "Suporte", "Contraste", "Aplicação" Sentimento: "Positivo", "Negativo", "Neutro" 

Importância: 1-5 (slider) 

\[ \] Essas informações usadas para análise de grafo  
**1.4 Construção e Visualização de Grafos** 

**RF 1.4.1 \- Estrutura do Grafo** 

\[ \] Nós representam citações (papel académico) 

\[ \] Arestas representam conexões entre papers: 

Citação direta (Paper A cita Paper B) 

Conceitos compartilhados (mesmo tópico/palavra-chave) Autores em comum (mesmo autor) 

Período próximo (artigos do mesmo período) 

\[ \] Weight das arestas: força do relacionamento (0-1) 

\[ \] JSON armazena: nodes\[\], edges\[\], metadata 

**RF 1.4.2 \- Renderização Interativa do Grafo** 

\[ \] Usar biblioteca JS: **D3.js**, **Cytoscape.js**, ou **vis.js** 

\[ \] Renderizar grafo com layout force-directed (física de partículas) \[ \] Nós: tamanho proporcional ao número de conexões 

\[ \] Cores: por tipo de documento ou cluster temático 

\[ \] Zoom: permitir zoom in/out com scroll 

\[ \] Pan: arrastar canvas para navegar 

\[ \] Controles: reset view, centralizar, fullscreen 

**RF 1.4.3 \- Interatividade com Nós** 

\[ \] Hover em nó: destacar conexões, mostrar tooltip com informações \[ \] Click em nó: selecionar e mostrar detalhes no painel lateral \[ \] Double-click: abrir modal completo com todas informações \[ \] Drag nó: permitir arrastar para reorganizar visualmente \[ \] Right-click: menu de ações (editar, deletar, favoritear) **RF 1.4.4 \- Análise de Grafo em Tempo Real** 

\[ \] Calcular grau de cada nó (número de conexões) 

\[ \] Calcular PageRank simplificado (identificar nós mais importantes) \[ \] Detectar clusters/comunidades (simple clustering JS) \[ \] Calcular distância entre pares de nós 

\[ \] Mostrar estatísticas: total nós, total arestas, densidade, diâmetro **RF 1.4.5 \- Filtros e Visualizações** 

\[ \] Filtrar por tipo de documento 

\[ \] Filtrar por ano (range slider)  
\[ \] Filtrar por autor (autocomplete) 

\[ \] Filtrar por importância (score) 

\[ \] Mostrar apenas connected components (sem nós isolados) \[ \] Toggle: arestas de citação vs arestas de conceito 

\[ \] Toggle: mostrar labels dos nós (on/off) 

\[ \] Opção "2-hop neighborhood": mostrar apenas papers distância 2 **RF 1.4.6 \- Insights Automáticos do Grafo** 

\[ \] Destacar automaticamente: 

Top 5 papers mais citados (maior grau) 

Papers foundacionais (citados por muitos, mas citam poucos) Papers recentes com alto impacto local 

Clusters temáticos (com labels) 

"Pontes": papers que conectam clusters diferentes 

\[ \] Sugerir: "Você deveria ler X (conecta seus tópicos)" 

**1.5 Formatação de Citações** 

**RF 1.5.1 \- Gerador de Referências** 

\[ \] Implementar formatadores para 3+ estilos: 

**ABNT**: `AUTOR, A. A. Título. Local: Editora, Ano.` **APA 7**: `Author, A. A. (Year). Title. Publisher.` 

**IEEE**: `[1] A. Author, "Title," Journal, vol. X, 2020.` (Opcional: Harvard, Chicago, MLA) 

\[ \] Usar Jinja2-like template rendering em JS puro 

**RF 1.5.2 \- Preview de Referências** 

\[ \] Mostrar preview em tempo real enquanto usuário digita \[ \] Lado-a-lado: mostrar mesma citação em 3 estilos diferentes \[ \] Destacar campos obrigatórios vs opcionais 

**RF 1.5.3 \- Copy & Export** 

\[ \] Botão "Copiar" para clipboard (usar Clipboard API) 

\[ \] Feedback visual: "Copiado\!" 

\[ \] Exportar toda lista de referências como .txt 

\[ \] Exportar para markdown (.md) 

\[ \] Opção de espaçamento: simples vs duplo  
**RF 1.5.4 \- Validação Inteligente** 

\[ \] Avisar se campos obrigatórios faltam 

\[ \] Sugerir: "Adicione DOI para melhor formatação" 

\[ \] Detectar duplicatas (mesmo autor \+ ano) 

\[ \] Corrigir automaticamente: "Smith et al." se 3+ autores 

**1.6 Análise e Ordenação de Citações** 

**RF 1.6.1 \- Ordenação Flexível** 

\[ \] Ordenar por: 

Autor (A-Z) 

Ano (crescente/decrescente) 

Tipo de documento 

Importância (score pessoal) 

Conectividade no grafo (grau) 

Data de adição 

Relevância (match com busca) 

\[ \] Multi-sort: ordem secundária quando há empate 

**RF 1.6.2 \- Filtros Avançados** 

\[ \] Busca por palavra-chave (titulo, autores, notas) 

\[ \] Filtro por intervalo de anos 

\[ \] Filtro por tipo de documento (multi-select) 

\[ \] Filtro por função da citação (background, método, suporte, etc) \[ \] Filtro por sentimento 

\[ \] Filtro por importância (≥3 stars) 

\[ \] Filtro: "Apenas não-lidas" ou "Apenas favoritas" 

\[ \] Combinação de filtros (AND logic) 

**RF 1.6.3 \- Busca Semântica Básica** 

\[ \] Busca text full-match em: autores, título, notas 

\[ \] Busca case-insensitive 

\[ \] Sugestões enquanto digita (autocomplete) 

\[ \] Highlight dos resultados na lista 

**RF 1.6.4 \- Análise de Impacto Local** 

\[ \] Para cada citação, mostrar:  
Número de vezes citada dentro do projeto (se aparece em múltiplos artigos) Score de conectividade no grafo 

"Influência local" (ranking) 

\[ \] Marcar: "Top 10 papers mais relevantes do seu projeto" 

**1.7 Persistência e Armazenamento** 

**RF 1.7.1 \- LocalStorage** 

\[ \] Salvar automaticamente a cada mudança (com debounce) 

\[ \] Estrutura JSON: 

`{` 

`"projects": [` 

`{` 

`"id": "proj_123",` 

`"name": "Meu Projeto",` 

`"created": "2025-11-21",` 

`"articles": [...],` 

`"citations": [...],` 

`"graph": {` 

`"nodes": [...],` 

`"edges": [...]` 

`},` 

`"metadata": {...}` 

`}` 

`]` 

`}` 

\[ \] Limite: até 5-10MB (avisar se aproximar do limite) 

\[ \] Indicador visual: "Salvando..." → "Salvo\!" 

**RF 1.7.2 \- Export/Import Manual** 

\[ \] Botão "Exportar Projeto" → download arquivo .json 

\[ \] Botão "Importar Projeto" → upload arquivo .json 

\[ \] Validação: verificar schema antes de importar 

\[ \] Backup: manter versão anterior ao importar 

\[ \] Opção: "Mesclar com projeto existente" 

**RF 1.7.3 \- Backup Automático** 

\[ \] Manter última versão em LocalStorage 

\[ \] Mostrar timestamp da última sincronização 

\[ \] Avisar se houver mudanças não-salvas  
**1.8 Interface e Experiência de Usuário** 

**RF 1.8.1 \- Dashboard Principal** 

\[ \] Layout 3-painel: 

**Painel Esquerdo**: Lista de projetos \+ novo projeto 

**Painel Centro**: Visualização principal (lista de citações ou grafo) **Painel Direito**: Detalhes da citação selecionada \+ ações \[ \] Tabs para alternar entre visualizações: "Lista", "Grafo", "Timeline" \[ \] Header com: logo, nome do projeto, ano, filtros globais **RF 1.8.2 \- Modos de Visualização** 

\[ \] **Modo Lista**: tabela de citações com colunas reordenáveis \[ \] **Modo Grafo**: visualização interativa de relacionamentos \[ \] **Modo Timeline**: linha do tempo de publicações por ano \[ \] **Modo Detalhes**: view completa de uma citação 

\[ \] Hotkeys: Tab para trocar modos, Esc para fechar modais **RF 1.8.3 \- Modais e Forms** 

\[ \] Modal para adicionar/editar citação 

\[ \] Modal para criar novo projeto 

\[ \] Modal para editar configurações 

\[ \] Modal para ver detalhes completos de um paper 

\[ \] Modal para exportar referências 

\[ \] Validação em tempo real (feedback imediato) 

**RF 1.8.4 \- Responsividade** 

\[ \] Funcional em desktop (1920px), tablet (768px), mobile (375px) \[ \] Mobile: layout single-column, menu colapsável 

\[ \] Touch-friendly: botões mínimo 44px, spacing adequado \[ \] Grafo reduzido em mobile (mostrar apenas top nodes) **RF 1.8.5 \- Acessibilidade** 

\[ \] ARIA labels em todos elementos interativos 

\[ \] Suporte a keyboard navigation (Tab, Enter, Esc, Arrows) \[ \] Contrast ratio ≥4.5:1 para texto 

\[ \] Sem dependência de cor apenas (icons \+ cor) 

\[ \] Semântica HTML correta (headings, buttons, forms)  
**1.9 Algoritmos e Análises** 

**RF 1.9.1 \- PageRank Simplificado** 

\[ \] Calcular PageRank modificado para papers locais 

\[ \] Fórmula: `PR(A) = (1-d)/N + d *` Σ`(PR(T)/C(T))` 

\[ \] Onde: d=0.85 (damping), N=número de nós 

\[ \] Iterar até convergência (5-10 iterações geralmente suficiente) \[ \] Output: score 0-100 por nó 

**RF 1.9.2 \- Clustering Temático** 

\[ \] Implementar clustering simples (K-means JS ou similaridade de cosine) \[ \] Base: palavras-chave dos titles/abstracts 

\[ \] Agrupar automaticamente papers por tópico 

\[ \] Atribuir cores visuais aos clusters 

\[ \] Sugerir nomes de clusters (mais frequentes palavras) 

**RF 1.9.3 \- Detecção de Comunidades** 

\[ \] Algoritmo: Louvain community detection (em JS) 

\[ \] Ou mais simples: agrupar por connected components 

\[ \] Mostrar quantas "comunidades" de pesquisa existe 

\[ \] Indicar "pontes": papers que conectam comunidades 

**RF 1.9.4 \- Análise Temporal** 

\[ \] Agrupar citações por década 

\[ \] Mostrar crescimento: quantos papers por período 

\[ \] Detectar "trending": aumento de publicações nos últimos anos \[ \] Sugerir: "Campo está crescendo 25%/ano" 

**1.10 Funcionalidades Avançadas (Opcionais)** 

**RF 1.10.1 \- Recomendações de Leitura** 

\[ \] Com base em papers já adicionados, sugerir relacionados \[ \] Usar similaridade de: autores, ano, título/conceitos 

\[ \] Scoring: papers que muitos citam, ou citam seus papers \[ \] "Você deveria ler..." com ranking 

**RF 1.10.2 \- Anotações e Highlights** 

\[ \] Permitir marcar trechos do artigo como "importante" 

\[ \] Armazenar highlights com contexto  
\[ \] Exibir highlights ao lado do grafo 

**RF 1.10.3 \- Templates de Pesquisa** 

\[ \] Criar templates pré-configurados: 

"Systematic Review" (muitos papers, filtros prontos) 

"Literature Survey" (histórico \+ timeline) 

"Paper Replication" (encontrar papers similares) 

\[ \] Usuário seleciona template ao criar projeto 

**RF 1.10.4 \- Dark Mode** 

\[ \] Toggle dark/light theme 

\[ \] Salvar preferência em localStorage 

\[ \] Aplicar tema ao grafo também (cores adaptadas) 

**RF 1.10.5 \- Atalhos de Teclado** 

\[ \] Ctrl+N: novo projeto 

\[ \] Ctrl+A: adicionar citação 

\[ \] Ctrl+S: force save 

\[ \] Ctrl+E: exportar 

\[ \] Ctrl+/: mostrar lista de atalhos 

**2\. REQUISITOS NÃO-FUNCIONAIS** 

**2.1 Performance** 

\[ \] Carregar página inicial em \<2s (First Paint) 

\[ \] Grafo com até 500 nós renderizar sem lag 

\[ \] Busca retornar resultados em \<200ms 

\[ \] Operações em JSON não travarem UI (usar Web Workers se necessário) 

**2.2 Compatibilidade** 

\[ \] Chrome 90+ 

\[ \] Firefox 88+ 

\[ \] Safari 14+ 

\[ \] Edge 90+ 

\[ \] iOS Safari 14+ 

\[ \] Android Chrome 90+  
**2.3 Segurança** 

\[ \] Dados armazenados localmente (sem enviar servidor) \[ \] Sanitizar input para prevenir XSS 

\[ \] Validar estrutura JSON antes de importar 

\[ \] Avisar antes de deletar dados 

**2.4 Usabilidade** 

\[ \] Onboarding: tutorial inicial 2-3 minutos 

\[ \] Help tooltips em primeiro uso 

\[ \] Erros com mensagens claras e acionáveis 

\[ \] Confirmação antes de ações destrutivas 

**2.5 Escalabilidade** 

\[ \] Suportar até 1000 citações por projeto (sem degradação severa) \[ \] Múltiplos projetos (limite por espaço localStorage) 

\[ \] Grafo com até 500 nós 

**3\. ARQUITETURA TÉCNICA** 

**3.1 Stack Tecnológico** 

`Frontend Framework: Vanilla JS (sem dependências) Libraries:` 

├─ `D3.js v7 (grafo interativo)` 

├─ `pdf.js (extração PDF)` 

├─ `json5 (parsing JSON flexível)` 

├─ `DOMPurify (sanitização)` 

└─ `Chart.js (gráficos opcionais)` 

`Storage: LocalStorage + JSON download/upload` 

`No backend: tudo client-side` 

**3.2 Estrutura de Pastas**

`citation-graph-app/` 

├── `index.html` 

├── `css/` 

│ ├── `style.css` 

│ ├── `dark-theme.css` 

│ └── `responsive.css` 

├── `js/` 

│ ├── `app.js (entry point)` 

│ ├── `storage.js (localStorage management)`   
│ ├── `parser.js (PDF + regex extraction)` 

│ ├── `graph.js (D3 visualization)` 

│ ├── `formatter.js (citation formatting)` 

│ ├── `algorithm.js (PageRank, clustering)` 

│ ├── `ui.js (DOM manipulation)` 

│ └── `utils.js (helpers)` 

├── `data/` 

│ └── `sample-data.json` 

├── `assets/` 

│ ├── `logo.svg` 

│ └── `icons/` 

└── `README.md` 

**3.3 Schema JSON Completo**

`{` 

`"version": "1.0",` 

`"projects": [` 

`{` 

`"id": "proj_uuid",` 

`"name": "Nome do Projeto",` 

`"description": "Descrição",` 

`"created": "2025-11-21T12:34:56Z",` 

`"updated": "2025-11-21T15:30:00Z",` 

`"color": "#3498db",` 

`"articles": [` 

`{` 

`"id": "art_uuid",` 

`"title": "Article Title",` 

`"authors": ["Author A", "Author B"],` 

`"year": 2025,` 

`"content": "...", // full text` 

`"uploadedAt": "2025-11-21T12:34:56Z",` 

`"source": "url|text|pdf"` 

`}` 

`],` 

`"citations": [` 

`{` 

`"id": "cit_uuid",` 

`"authors": ["Smith, J.", "Jones, M."],` 

`"title": "Citation Title",` 

`"year": 2020,` 

`"type": "journal|conference|book|preprint|website",` 

`"doi": "10.1234/example",` 

`"url": "https://...",` 

`"journal": "Nature",` 

`"volume": "12",` 

`"issue": "3",` 

`"pages": "123-145",` 

`"notes": "Personal notes",` 

`"context": "Sentence where cited",` 

`"function": "background|method|support|contrast|application", "sentiment": "positive|negative|neutral",`   
`"importance": 3, // 1-5` 

`"isFavorite": false,`   
`"createdAt": "2025-11-21T12:34:56Z",` 

`"editedAt": "2025-11-21T15:30:00Z"` 

`}` 

`],` 

`"graph": {` 

`"nodes": [` 

`{` 

`"id": "cit_uuid",` 

`"label": "Smith et al. (2020)",` 

`"size": 25,` 

`"color": "#e74c3c",` 

`"cluster": 1,` 

`"pagerank": 0.45,` 

`"degree": 8` 

`}` 

`],` 

`"edges": [` 

`{` 

`"source": "cit_uuid_1",` 

`"target": "cit_uuid_2",` 

`"type": "cites|concept|author|temporal",` 

`"weight": 0.8,` 

`"label": "shares concepts"` 

`}` 

`]` 

`},` 

`"settings": {` 

`"defaultFormat": "abnt",` 

`"darkMode": false,` 

`"autoSave": true,` 

`"graphLayout": "force"` 

`}` 

`}` 

`]` 

`}` 

**4\. CASOS DE USO PRINCIPAIS** 

**UC-1: Pesquisador quer Extrair Citações de um PDF**

`1. Upload PDF` 

`2. Sistema extrai automaticamente texto e detecta citações via regex 3. Usuário aprova/rejeita sugestões` 

`4. Citações aparecem na lista e no grafo` 

`5. Usuário pode editar/adicionar manualmente`   
**UC-2: Visualizar Relacionamentos Entre Papers** 

`1. Grafo renderizado automaticamente com D3.js` 

`2. Usuário clica em nó para ver detalhes` 

`3. Vizinhos destacados` 

`4. Filtros aplicados (ano, tipo)` 

`5. PageRank identifica papers mais importantes` 

**UC-3: Gerar Lista de Referências** 

`1. Selecionar citações ou todos` 

`2. Escolher formato (ABNT/APA/IEEE)` 

`3. Preview em tempo real` 

`4. Copiar ou exportar` 

**UC-4: Analisar Tendências da Pesquisa** 

`1. Timeline mostra papers por ano` 

`2. Detectar crescimento de publicações` 

`3. Clustering mostra tópicos principais` 

`4. Recomendações baseado em análise` 

**5\. DIFERENCIAL COMPETITIVO** 

**O que faz seu projeto VENCER no concurso:**

| Feature  | Concorrente Mais Próximo  | Seu Diferencial |
| ----- | ----- | ----- |
| **Extração automática**  | Copiar-colar manual  | Regex \+ patterns inteligentes |
| **Grafo interativo**  | Nenhum (não há)  | D3.js profissional \+ análise |
| **PageRank local**  | Nenhum  | Score de importância automático |
| **Múltiplos formatos**  | Mendeley (4)  | ABNT, APA, IEEE \+ mais |
| **Análise temporal**  | Nenhum  | Timeline \+ trending detection |
| **Clustering temático**  | Nenhum  | Agrupamento automático |
| **Acessibilidade**  | Mendeley (fraco)  | WCAG 2.1 AA compliant |
| **Responsividade**  | Zotero (não é web)  | Mobile-first \+ desktop |
| **Zero dependências externas**  | Todos  | Pure JS (offline-first) |

**6\. ROADMAP DE DESENVOLVIMENTO** 

**Semana 1: Core (MVP)** 

\[x\] Setup projeto \+ assets 

\[x\] Dashboard base (3-painel) 

\[x\] Upload PDF \+ extração texto 

\[x\] Adição manual de citações 

\[x\] Armazenamento em LocalStorage 

\[x\] Listagem \+ busca básica 

**Semana 2: Grafo \+ Análise** 

\[x\] D3.js grafo renderização 

\[x\] Extração automática via regex 

\[x\] PageRank \+ clustering 

\[x\] Filtros e ordenação 

\[x\] Tema dark mode 

**Semana 3: Formatação \+ Polish** 

\[x\] Formatadores ABNT/APA/IEEE 

\[x\] Responsividade mobile 

\[x\] Acessibilidade 

\[x\] Testes e bug fixes 

\[x\] Documentação 

**Semana 4: Apresentação** 

\[x\] Vídeo demo profissional 

\[x\] GitHub README impecável 

\[x\] Deploy (GitHub Pages) 

\[x\] Apresentação ao vivo 

**7\. MÉTRICAS DE SUCESSO**

| Métrica  | Meta |
| ----- | ----- |
| **Tempo para extrair 50 citações**  | \< 2 minutos |
| **Tamanho máximo projeto**  | 1000 citações (5-10MB) |
| **Performance grafo**  | 500 nós sem lag |

| Métrica  | Meta |
| ----- | ----- |
| **Taxa de satisfação (supostamente)**  | ≥9/10 |
| **Cobertura de features**  | ≥80% do que planejado |
| **Código quality**  | Sem eslint warnings |
| **Mobile usability**  | ≥90 Lighthouse score |
| **Accessibility**  | WCAG 2.1 AA |

**8\. Exemplo: Fluxo de Uso Completo** 

`Pesquisador abre app` 

`↓` 

`"Novo Projeto"` → `"Meu Survey de IA"` 

`↓` 

`Upload PDF do artigo base` 

`↓` 

`App extrai automaticamente citações via regex` 

`↓` 

`Usuário aprova top 20 sugestões` 

`↓` 

`Grafo renderiza: 20 nós, 45 arestas` 

`↓` 

`Clica em nó central` → `vê detalhes + vizinhos destacados` 

`↓` 

`Aplica filtro: apenas 2020-2025` 

`↓` 

`Ordena por PageRank` → `vê top papers` 

`↓` 

`Seleciona top 10, exporta em ABNT` 

`↓` 

`Copia referências para tese` 

`↓` 

`"Salvo!"` ✓ 

**9\. Stack Recomendado (Confirmado Funciona em JS Puro)** 

**PDF Handling**

`// Option 1: pdf.js (Mozilla)` 

`&lt;script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"&gt;&lt` 

`// Option 2: pdfjs-dist (npm)` 

`import * as pdfjsLib from 'pdfjs-dist';`   
**Graph Visualization** 

`// Option 1: D3.js (mais profissional)` 

`&lt;script src="https://d3js.org/d3.v7.min.js"&gt;&lt;/script&gt;` 

`// Option 2: Cytoscape.js (para grafos mais avançados)` 

`&lt;script src="https://unpkg.com/cytoscape/dist/cytoscape.min.js"&gt;&lt;/script&gt;` 

`// Option 3: vis.js (intermediário, mais fácil)` 

`&lt;script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"&gt;&lt;/` 

**Utilities** 

`// Text sanitization` 

`&lt;script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"&gt;&lt;/` 

`// Storage management` 

`// localStorage built-in (sem lib)` 

`// JSON parsing` 

`// JSON built-in (+ json5 se necessário)` 

`// Clipboard API` 

`// navigator.clipboard built-in` 

**10\. Checklist Final para Concurso** 

**Funcionalidade** 

\[ \] Upload de PDF funciona 

\[ \] Extração automática de citações funciona (≥50%) 

\[ \] Grafo renderiza sem erros 

\[ \] Formatação em 3 estilos funciona 

\[ \] Exportação/Importação funciona 

\[ \] Busca e filtros funcionam 

\[ \] LocalStorage persiste dados 

**Código** 

\[ \] Sem console.error ou warnings 

\[ \] Código bem comentado 

\[ \] Estrutura modular (separado em arquivos) 

\[ \] Sem dependências de backend 

\[ \] Funciona offline  
**UX** 

\[ \] Carrega rápido (\<2s) 

\[ \] Interface intuitiva (sem tutorial longo) 

\[ \] Responsivo em mobile 

\[ \] Acessível (keyboard nav, ARIA) 

\[ \] Erros com mensagens úteis 

**Apresentação** 

\[ \] README profissional com screenshots 

\[ \] Vídeo demo (3-5 min) 

\[ \] GitHub com commits significativos 

\[ \] Documentação técnica básica 

\[ \] Exemplos de uso no README 

**Conclusão** 

**Este projeto, feito 100% em HTML \+ CSS \+ JS \+ JSON, é capaz de:** 

✅ Competir com Mendeley/Zotero em features essenciais ✅ Oferecer análises que eles não oferecem (grafos, clustering, PageRank) ✅ Rodar completamente offline (vantagem competitiva) 

✅ Ser visualmente impressionante (D3.js grafo interativo) ✅ Ser demonstrável ao vivo (sem dependência de backend) 

**Isso é suficiente para VENCER a bolsa.** 

**Próximo passo:** Você quer que eu comece criando: 

1\. HTML \+ CSS (estrutura \+ styling)? 

2\. Storage.js (gerenciamento de dados)? 

3\. Parser.js (extração de PDF \+ regex)? 

4\. Graph.js (D3.js visualization)? 

5\. Formatter.js (ABNT/APA/IEEE)?

Qual é prioridade? 