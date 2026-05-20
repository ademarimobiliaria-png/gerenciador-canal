// Monta a representação HTML do laudo, tanto para a tela de preview quanto
// para o documento de impressão.

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const NUM = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PCT = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 });

function safe(v, fallback = '—') {
  if (v === undefined || v === null || v === '') return fallback;
  return String(v);
}

function brl(v) { return Number.isFinite(v) ? BRL.format(v) : '—'; }
function num(v, d = 2) {
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function pct(v) { return Number.isFinite(v) ? PCT.format(v) : '—'; }

function variavelTexto(v) {
  return ({
    privativa: 'área privativa',
    construida: 'área construída',
    terreno: 'área de terreno'
  })[v] || 'área';
}

function metodoTexto(m) {
  return ({
    'MCDDM-Fatores': 'Método Comparativo Direto de Dados de Mercado — Tratamento por Fatores',
    'MCDDM-Regressao': 'Método Comparativo Direto de Dados de Mercado — Inferência Estatística',
    'Evolutivo': 'Método Evolutivo',
    'Involutivo': 'Método Involutivo',
    'Renda': 'Método da Capitalização da Renda',
    'Custo': 'Método da Quantificação do Custo'
  })[m] || m;
}

export function renderLaudo({ dados, calculo }) {
  const d = dados;
  const r = calculo || {};
  const amostras = r.homogeneizadas || [];
  const enderecoCompleto = [d.imovel?.endereco, d.imovel?.bairro, d.imovel?.cidade].filter(Boolean).join(' — ');

  const capa = `
    <section class="capa">
      <div class="meta">LAUDO TÉCNICO</div>
      <h1>Laudo de Avaliação Imobiliária</h1>
      <h2>Conforme ABNT NBR 14653-1 e NBR 14653-2</h2>
      <div class="ref">
        <p><strong>Imóvel:</strong> ${safe(enderecoCompleto, safe(d.imovel?.endereco))}</p>
        <p><strong>Solicitante:</strong> ${safe(d.solicitante?.nome)}</p>
        <p><strong>Finalidade:</strong> ${safe(d.laudo?.finalidade)}</p>
        <p><strong>Data de referência:</strong> ${safe(formatDate(d.laudo?.dataReferencia))}</p>
      </div>
    </section>
    <div class="page-break"></div>
  `;

  const sec1 = `
    <section>
      <h1>1. Solicitante e finalidade</h1>
      <div class="grid2">
        <div><strong>Nome / Razão social:</strong> ${safe(d.solicitante?.nome)}</div>
        <div><strong>CPF / CNPJ:</strong> ${safe(d.solicitante?.documento)}</div>
        <div><strong>Endereço:</strong> ${safe(d.solicitante?.endereco)}</div>
        <div><strong>Finalidade:</strong> ${safe(d.laudo?.finalidade)}</div>
        <div><strong>Objetivo:</strong> ${safe(d.laudo?.objetivo)}</div>
        <div><strong>Data de referência:</strong> ${safe(formatDate(d.laudo?.dataReferencia))}</div>
      </div>
      <h3>Pressupostos, ressalvas e fatores limitantes</h3>
      <p>${safe(d.laudo?.pressupostos, 'Não informados.')}</p>
    </section>
  `;

  const sec2 = `
    <section>
      <h1>2. Identificação e caracterização do imóvel</h1>
      <div class="grid2">
        <div><strong>Tipo:</strong> ${safe(d.imovel?.tipo)}</div>
        <div><strong>Matrícula:</strong> ${safe(d.imovel?.matricula)}</div>
        <div><strong>Endereço:</strong> ${safe(d.imovel?.endereco)}</div>
        <div><strong>Bairro / Cidade:</strong> ${safe(d.imovel?.bairro)} — ${safe(d.imovel?.cidade)}</div>
        <div><strong>Área do terreno:</strong> ${safe(d.imovel?.areaTerreno)} m²</div>
        <div><strong>Área construída:</strong> ${safe(d.imovel?.areaConstruida)} m²</div>
        <div><strong>Área privativa:</strong> ${safe(d.imovel?.areaPrivativa)} m²</div>
        <div><strong>Fração ideal:</strong> ${safe(d.imovel?.fracaoIdeal)}</div>
      </div>

      <h3>Vistoria</h3>
      <div class="grid2">
        <div><strong>Data da vistoria:</strong> ${safe(formatDate(d.vistoria?.data))}</div>
        <div><strong>Padrão construtivo:</strong> ${safe(d.vistoria?.padrao)}</div>
        <div><strong>Idade aparente:</strong> ${safe(d.vistoria?.idade)} anos</div>
        <div><strong>Estado de conservação (Heidecke):</strong> ${safe(d.vistoria?.conservacao)}</div>
        <div><strong>Dormitórios:</strong> ${safe(d.vistoria?.dormitorios)} (${safe(d.vistoria?.suites)} suíte(s))</div>
        <div><strong>Banheiros:</strong> ${safe(d.vistoria?.banheiros)}</div>
        <div><strong>Vagas:</strong> ${safe(d.vistoria?.vagas)}</div>
        <div><strong>Andar:</strong> ${safe(d.vistoria?.andar)}</div>
        <div><strong>Face / posição solar:</strong> ${safe(d.vistoria?.face)}</div>
      </div>
      <h3>Acabamentos e instalações</h3>
      <p>${safe(d.vistoria?.acabamentos)}</p>
      <h3>Itens de lazer e infraestrutura</h3>
      <p>${safe(d.vistoria?.lazer)}</p>
      <h3>Equipamentos urbanos</h3>
      <p>${safe(d.vistoria?.equipamentos)}</p>
    </section>
  `;

  const sec3 = `
    <section>
      <h1>3. Diagnóstico do mercado imobiliário</h1>
      <div class="grid2">
        <div><strong>Liquidez:</strong> ${safe(d.mercado?.liquidez)}</div>
        <div><strong>Comportamento:</strong> ${safe(d.mercado?.comportamento)}</div>
        <div><strong>Oferta x demanda:</strong> ${safe(d.mercado?.ofertaDemanda)}</div>
        <div><strong>Tendência:</strong> ${safe(d.mercado?.tendencia)}</div>
      </div>
      <p>${safe(d.mercado?.comentario)}</p>
    </section>
  `;

  const linhasAmostra = amostras.map(a => `
    <tr${a.ehOutlier ? ' style="color:#888;text-decoration:line-through"' : ''}>
      <td>${a.index}</td>
      <td>${safe(a.original.endereco)}</td>
      <td>${safe(a.original.fonte)}</td>
      <td class="num">${num(Number(a.original.area), 2)}</td>
      <td class="num">${brl(Number(a.original.preco))}</td>
      <td class="num">${brl(a.bruto)}</td>
      <td class="num">${num(a.fTotal, 3)}</td>
      <td class="num">${brl(a.vuHom)}</td>
    </tr>
  `).join('');

  const sec4 = `
    <section>
      <h1>4. Método, amostra e tratamento</h1>
      <p><strong>Método:</strong> ${metodoTexto(d.metodo?.tipo)}.</p>
      <p><strong>Variável de comparação:</strong> preço por m² de ${variavelTexto(d.metodo?.variavel)}.</p>

      <h3>Amostra de mercado</h3>
      <table>
        <thead>
          <tr>
            <th>#</th><th>Referência</th><th>Fonte</th>
            <th class="num">Área (m²)</th><th class="num">Preço total</th>
            <th class="num">VU bruto (R$/m²)</th>
            <th class="num">F total</th>
            <th class="num">VU homog. (R$/m²)</th>
          </tr>
        </thead>
        <tbody>${linhasAmostra || '<tr><td colspan="8">Sem amostras cadastradas.</td></tr>'}</tbody>
      </table>

      ${r.removidos && r.removidos.length ? `
        <p class="meta"><em>Saneamento da amostra pelo critério de Chauvenet:
          ${r.removidos.length} dado(s) removido(s) por discrepância estatística.</em></p>
      ` : '<p class="meta"><em>Nenhum dado removido pelo critério de Chauvenet.</em></p>'}
    </section>
  `;

  const sec5 = `
    <section>
      <h1>5. Tratamento estatístico</h1>
      <div class="grid2">
        <div><strong>n efetivo:</strong> ${safe(r.nEfetivo)}</div>
        <div><strong>Média (R$/m²):</strong> ${brl(r.media)}</div>
        <div><strong>Mediana (R$/m²):</strong> ${brl(r.mediana)}</div>
        <div><strong>Desvio-padrão (R$/m²):</strong> ${brl(r.desvio)}</div>
        <div><strong>Coeficiente de variação:</strong> ${pct(r.cv)}</div>
        <div><strong>Intervalo de confiança (80%):</strong> ${brl(r.icInf)} — ${brl(r.icSup)}</div>
        <div><strong>Amplitude do IC 80%:</strong> ${pct(r.amplitude)}</div>
      </div>
    </section>
  `;

  const sec6 = `
    <section>
      <h1>6. Resultado da avaliação</h1>
      <div class="destaque">
        <p>Valor unitário adotado: <strong>${brl(r.valorUnitario)} / m²</strong></p>
        <p>Valor de avaliação: <strong>${brl(r.valorTotal)}</strong></p>
        <p class="meta">Variável: ${variavelTexto(d.metodo?.variavel)} (${safe(num(areaAvaliando(d), 2))} m²)</p>
      </div>

      <h3>Especificação da avaliação (NBR 14653-2)</h3>
      <div class="grid2">
        <div><strong>Grau de fundamentação:</strong> ${safe(r.grauFundamentacao?.grau)} (${safe(r.grauFundamentacao?.motivo)})</div>
        <div><strong>Grau de precisão:</strong> ${safe(r.grauPrecisao?.grau)} (${safe(r.grauPrecisao?.motivo)})</div>
      </div>
    </section>
  `;

  const sec7 = `
    <section>
      <h1>7. Encerramento</h1>
      <p>O presente laudo foi elaborado em consonância com as prescrições da
      ABNT NBR 14653-1 (Procedimentos gerais) e ABNT NBR 14653-2 (Imóveis urbanos),
      empregando o ${metodoTexto(d.metodo?.tipo)}. As condições de mercado e demais
      premissas foram observadas na data de referência indicada. O resultado obtido
      reflete o valor mais provável dentro das condições normais de mercado.</p>

      <p>${safe(d.laudo?.localData, '')}</p>

      <div class="sig">
        <div class="line"></div>
        <div><strong>${safe(d.responsavel?.nome)}</strong></div>
        <div>${safe(d.responsavel?.formacao)}</div>
        <div>${safe(d.responsavel?.registro)}</div>
        <div>CPF: ${safe(d.responsavel?.cpf)}</div>
      </div>
    </section>
  `;

  return [capa, sec1, sec2, sec3, sec4, sec5, sec6, sec7].join('\n');
}

function areaAvaliando(d) {
  const v = d.metodo?.variavel;
  if (v === 'terreno') return Number(d.imovel?.areaTerreno) || 0;
  if (v === 'construida') return Number(d.imovel?.areaConstruida) || 0;
  return Number(d.imovel?.areaPrivativa)
    || Number(d.imovel?.areaConstruida)
    || Number(d.imovel?.areaTerreno) || 0;
}

function formatDate(value) {
  if (!value) return '';
  const [y, m, d] = String(value).split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

export { areaAvaliando };
