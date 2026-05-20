# Laudo de Avaliação Imobiliária — ABNT NBR 14653

App web para emissão de laudos de avaliação de imóveis urbanos seguindo as
diretrizes da **ABNT NBR 14653-1** (procedimentos gerais) e da **NBR 14653-2**
(imóveis urbanos), com foco no **Método Comparativo Direto de Dados de Mercado
— Tratamento por Fatores (MCDDM)**.

## Como usar

1. Abra `index.html` no navegador (Chrome, Edge ou Firefox recentes).
2. Preencha as 8 seções do formulário (todos os campos são salvos
   automaticamente no `localStorage` do navegador).
3. Em **5. Método e amostra**, cadastre os dados de mercado utilizados.
4. Em **6. Homogeneização**, ajuste os pesos dos fatores conforme a pesquisa.
5. Clique em **Calcular avaliação** para ver média, IC 80 %, grau de
   fundamentação e grau de precisão (NBR 14653-2).
6. Clique em **Gerar PDF / Imprimir** no topo — o navegador abrirá a caixa de
   impressão. Escolha “Salvar como PDF” para gerar o laudo completo em PDF.

Há um botão **Carregar exemplo** que preenche o app com um caso de
apartamento residencial em Curitiba, útil para conhecer o fluxo.

## O que entra no laudo (PDF / impressão)

O laudo gerado contém, em todas as páginas, somente o conteúdo técnico
(o topbar e os controles do app são suprimidos via `@media print`):

1. **Capa** — identificação do imóvel, solicitante, finalidade e data de
   referência.
2. **Solicitante e finalidade** — pressupostos, ressalvas e fatores
   limitantes.
3. **Identificação e caracterização do imóvel** + vistoria detalhada.
4. **Diagnóstico do mercado imobiliário**.
5. **Método, amostra e tratamento** — tabela completa com valor unitário
   bruto, fator total e valor unitário homogeneizado de cada amostra,
   indicando outliers saneados pelo critério de Chauvenet.
6. **Tratamento estatístico** — média, mediana, desvio-padrão, CV,
   intervalo de confiança 80 % e amplitude do IC.
7. **Resultado da avaliação** — valor unitário e valor total, com a
   especificação (grau de fundamentação e grau de precisão).
8. **Encerramento** com local, data e assinatura do responsável técnico.

## Estrutura

```
index.html               Formulário e estrutura do app
css/styles.css           Estilo da interface
css/print.css            Layout do PDF / impressão (A4, margens, tipografia serifa)
js/app.js                Controlador principal (formulário, persistência, fluxo)
js/statistics.js         Média, mediana, desvio, Chauvenet, IC 80 % (t-Student)
js/nbr14653.js           Enquadramento NBR 14653-2 (fundamentação e precisão)
js/homogeneizacao.js     Cálculo dos fatores de homogeneização (MCDDM)
js/laudo.js              Renderização do laudo HTML (preview + impressão)
```

## Limitações

- A versão atual contempla apenas o **tratamento por fatores** do MCDDM.
  A inferência estatística por regressão e os métodos evolutivo, involutivo,
  renda e custo podem ser selecionados no formulário, mas o cálculo
  automático é feito somente para o tratamento por fatores.
- A classificação do grau de fundamentação considera os itens objetivos
  (quantidade de dados e amplitude do IC). Os itens subjetivos
  (caracterização, identificação dos dados e apresentação dos cálculos)
  são considerados atendidos por o app oferecer formulário completo —
  o avaliador permanece responsável pela aderência integral à norma.

## Privacidade

Os dados ficam exclusivamente no navegador do usuário (`localStorage`).
Nenhuma informação é enviada para servidores externos.
