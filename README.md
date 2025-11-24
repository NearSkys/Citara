<div align="center">
  <img src="./images/logo.png" alt="Logo Citara" width="120"/>
  <h1>Citara</h1>
  <h3>Gerenciador de Referências Acadêmicas</h3>
</div>

---

**Citara** é uma aplicação front-end para organização de referências acadêmicas (PDFs e DOIs), busca de artigos e montagem de bibliografias. Foi desenvolvido durante a **Imersão Dev da Alura** com o objetivo de demonstrar competências em desenvolvimento frontend e concorrer a uma bolsa na FIAP.

## Sobre o nome

O nome do projeto surge da combinação de dois elementos principais:

1.  **Citações:** O núcleo funcional da aplicação, focada no gerenciamento bibliográfico.
2.  **Cítara:** O instrumento musical.

A escolha busca associar a organização de referências uma tarefa frequentemente caótica e estressante à tranquilidade, foco e fluidez evocadas pela sonoridade do instrumento. A intenção é prover uma experiência de uso que traga clareza ao processo de pesquisa.

<div align="center">
  <p><em>Inspiração sonora para a atmosfera do projeto:</em></p>
  <a href="https://youtu.be/h0AAFhx3RmA" target="_blank" title="Ouvir a inspiração sonora (YouTube)">
    <img src="https://img.youtube.com/vi/h0AAFhx3RmA/hqdefault.jpg" alt="Vídeo de performance de Cítara" width="480" style="border-radius: 8px; border: 1px solid #ddd;"/>
  </a>
</div>

---

## Funcionalidades principais

- **Busca integrada:** Pesquisa de artigos diretamente pela API pública do Semantic Scholar.
- **Visualização em grafo:** Exploração visual das conexões e relações entre diferentes referências.
- **Gerenciamento local:** Upload de PDFs com extração básica de metadados e capacidade de edição manual.
- **Organização:** Filtros avançados por autor, ano, palavras-chave e tags personalizadas.
- **Interface dinâmica:** Uso de modais para adição rápida de citações e gerenciamento de projetos.

---

## Status da Integração com IA (Feature Experimental)

A arquitetura original previa um modelo de IA generativa como "processador" central para enriquecer metadados, extrair citações do texto completo dos PDFs e sugerir novas referências.

No entanto, esta funcionalidade permanece em **estado experimental/protótipo** devido a limitações técnicas do ambiente *client-side*:

* **Políticas de CORS:** Chamadas diretas do navegador para APIs de IA são frequentemente bloqueadas por segurança. A solução robusta exige um backend intermediário (proxy) para gerenciar as requisições.
* **Segurança e Custos:** Expor chaves de API em código front-end público é uma falha de segurança crítica. Além disso, o controle de quotas e custos de APIs pagas torna inviável um uso público sem um servidor para autenticação e rate limiting.

O núcleo da aplicação (busca, organização e UI) é totalmente funcional sem essa camada de IA.

---

## Problemas conhecidos e Limitações

- **Requisições de API:** Podem falhar devido a políticas de CORS dependendo do ambiente de deploy (ex: GitHub Pages vs. localhost) ou alterações nas APIs públicas de terceiros.
- **Persistência de Dados:** Todos os uploads e dados são armazenados **localmente no navegador** (IndexedDB/LocalStorage). Não há criptografia, backup em nuvem ou controle de acesso multiusuário. **Não utilize para dados sensíveis.**
- **Funcionalidades Incompletas:** A integração com IA e os exportadores de formatos bibliográficos (BibTeX, RIS) ainda não estão finalizados.

---

## Screenshots

<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start; justify-content: center; padding: 20px 0;">

<figure style="width:300px;margin:0;">
<img src="./images/search.PNG" alt="Página de busca" style="width:100%;border:1px solid #ccc;border-radius:6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
<figcaption style="font-size:0.85rem;color:#666;margin-top:8px;text-align:center;">Busca de artigos</figcaption>
</figure>

<figure style="width:300px;margin:0;">
<img src="./images/viewlist.PNG" alt="Visualização em lista" style="width:100%;border:1px solid #ccc;border-radius:6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
<figcaption style="font-size:0.85rem;color:#666;margin-top:8px;text-align:center;">Visualização em lista</figcaption>
</figure>

<figure style="width:300px;margin:0;">
<img src="./images/graph.PNG" alt="Visualização em grafo" style="width:100%;border:1px solid #ccc;border-radius:6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
<figcaption style="font-size:0.85rem;color:#666;margin-top:8px;text-align:center;">Visualização de relações em grafo</figcaption>
</figure>

<figure style="width:300px;margin:0;">
<img src="./images/uploadzone.PNG" alt="Área de upload" style="width:100%;border:1px solid #ccc;border-radius:6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
<figcaption style="font-size:0.85rem;color:#666;margin-top:8px;text-align:center;">Área de upload de PDFs</figcaption>
</figure>

<figure style="width:300px;margin:0;">
<img src="./images/project.PNG" alt="Lista de projetos" style="width:100%;border:1px solid #ccc;border-radius:6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
<figcaption style="font-size:0.85rem;color:#666;margin-top:8px;text-align:center;">Gerenciamento de projetos</figcaption>
</figure>

</div>

---

## Roadmap

- [ ] Desenvolvimento de um **backend seguro** para mediar a integração com IA (resolver CORS e proteger credenciais).
- [ ] Implementação de sistema de **autenticação e sincronização** de dados na nuvem.
- [ ] Melhoria do parser de metadados de PDF.
- [ ] Finalização dos **exportadores** para formatos padrão (BibTeX, RIS, EndNote).

---

<div align="center">
  <p>Deploy realizado no GitHub Pages.</p>
</div>