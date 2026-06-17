# Vistoria de Imóveis

App web para registrar e emitir **laudos de vistoria de imóveis** (entrada,
saída, periódica ou conferência), com avaliação ambiente por ambiente,
fotos, leituras de medidores, controle de chaves e geração de PDF para
impressão e assinatura.

Funciona inteiramente no navegador, sem servidor: todos os dados ficam no
`localStorage` da máquina do usuário.

## Como usar

1. Abra `index.html` no navegador (Chrome, Edge ou Firefox recentes).
2. Preencha as seções do formulário — tudo é salvo automaticamente.
3. Em **4. Ambientes**, use os botões de modelo rápido (Sala, Cozinha,
   Quarto, Banheiro…) para já criar o cômodo com seus itens mais comuns,
   ou crie um ambiente **em branco**.
4. Para cada item, escolha a **condição** (Novo, Ótimo, Bom, Regular, Ruim,
   Danificado, N/A) e adicione observações. Anexe **fotos** por ambiente —
   elas são redimensionadas automaticamente antes de serem salvas.
5. Em **5. Móveis e eletrodomésticos**, cadastre o inventário do imóvel
   (marca, modelo, número de série, quantidade e estado).
6. Em **6. Manutenção e limpeza**, use **Carregar checklist padrão** e
   registre situação, data e responsável de cada serviço.
7. Em **7. Comparativo entrada × saída**, carregue o JSON exportado da
   vistoria de entrada para comparar item a item o que mudou.
8. Clique em **Gerar PDF / Imprimir** no topo e escolha “Salvar como PDF”
   na caixa de impressão do navegador.

Use **Carregar exemplo** para ver um caso preenchido (vistoria de entrada de
um apartamento em Curitiba).

## O que entra no laudo (PDF / impressão)

A interface do app é suprimida na impressão (via `@media print`); o
documento gerado contém:

1. **Capa** — tipo de vistoria, finalidade, endereço e data de referência.
2. **Identificação** do imóvel (tipo, ocupação, área, endereço).
3. **Partes envolvidas** — locador, locatário, imobiliária e vistoriador.
4. **Medidores e chaves** — leituras de energia, água e gás e contagem de
   chaves/controles entregues.
5. **Ambientes vistoriados** — tabela por cômodo (item, condição,
   observações) com selo colorido por condição e galeria de fotos, além de
   um resumo com a contagem de itens por condição.
6. **Móveis e eletrodomésticos** — inventário com marca, modelo, número de
   série, quantidade e estado (aparece só quando há itens).
7. **Manutenção e limpeza** — serviços com situação, data e responsável
   (aparece só quando há itens).
8. **Comparativo entrada × saída** — quando uma vistoria de entrada é
   carregada, lista o que foi mantido, piorou, melhorou ou surgiu de novo.
9. **Observações gerais** e **termo de responsabilidade**.
10. **Assinaturas** do vistoriador, locador e locatário.

As seções opcionais (inventário, manutenção e comparativo) só entram no PDF
quando têm conteúdo, e a numeração se ajusta automaticamente.

## Estrutura

```
index.html             Formulário e estrutura do app
css/styles.css         Estilo da interface
css/print.css          Layout do PDF / impressão (A4, tabelas, assinaturas)
js/state.js            Modelo de dados, condições e utilitários de estado
js/storage.js          Persistência no localStorage
js/photos.js           Leitura e compressão (redimensionamento) das fotos
js/templates.js        Modelos de itens por tipo de ambiente
js/sample.js           Caso de exemplo
js/report.js           Renderização do laudo HTML para impressão
js/app.js              Controlador principal (formulário, ambientes,
                       inventário, manutenção, comparativo, fluxo)
```

## Exportar / importar

- **Exportar JSON** salva todo o estado (incluindo fotos) em um arquivo,
  útil para backup ou para continuar a vistoria em outro dispositivo.
- **Importar JSON** restaura um arquivo exportado anteriormente.

## Privacidade

Os dados (textos e fotos) ficam exclusivamente no navegador do usuário
(`localStorage`). Nenhuma informação é enviada para servidores externos.
Como as fotos ocupam espaço, vistorias muito extensas podem atingir o
limite do `localStorage` — nesse caso, exporte o JSON regularmente.
