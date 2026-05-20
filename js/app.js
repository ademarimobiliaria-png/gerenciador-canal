// Controlador principal do app de laudos de avaliação imobiliária.

import { mean, median, stdDev, coefVar, chauvenetOutliers, confidenceInterval80 } from './statistics.js';
import { grauFundamentacao, grauPrecisao } from './nbr14653.js';
import { homogenizarAmostras } from './homogeneizacao.js';
import { renderLaudo, areaAvaliando } from './laudo.js';

const STORAGE_KEY = 'laudo-imobiliario-v1';
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  amostras: [],
  ultimoCalculo: null
};

// ---------- Inicialização ----------
window.addEventListener('DOMContentLoaded', () => {
  bindToolbar();
  bindForm();
  bindAmostras();
  carregarEstado();
  if (!state.amostras.length) {
    // Garante ao menos uma linha vazia para começar
    addAmostra();
  }
  atualizarPreview();
});

// ---------- Toolbar ----------
function bindToolbar() {
  $('#btn-novo').addEventListener('click', () => {
    if (!confirm('Limpar todos os dados deste laudo?')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  $('#btn-exemplo').addEventListener('click', () => {
    carregarExemplo();
    atualizarPreview();
  });

  $('#btn-exportar').addEventListener('click', () => {
    const dados = coletarDados();
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const nome = (dados.solicitante?.nome || 'laudo').replace(/[^\w-]+/g, '_');
    a.download = `laudo-${nome}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('#file-importar').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const dados = JSON.parse(text);
      aplicarDados(dados);
      atualizarPreview();
    } catch (err) {
      alert('Arquivo inválido: ' + err.message);
    } finally {
      e.target.value = '';
    }
  });

  $('#btn-imprimir').addEventListener('click', () => {
    // Antes de imprimir, força recalcular silenciosamente para garantir que o
    // laudo impresso reflita exatamente o que está no formulário.
    const dados = coletarDados();
    const calculo = calcular(dados, { silent: true });
    if (calculo) state.ultimoCalculo = calculo;
    atualizarPreview();
    requestAnimationFrame(() => window.print());
  });

  $('#btn-calcular').addEventListener('click', () => {
    const dados = coletarDados();
    state.ultimoCalculo = calcular(dados);
    if (state.ultimoCalculo) mostrarResultado(state.ultimoCalculo, dados);
    salvarEstado();
    atualizarPreview();
  });

  $('#btn-atualizar-preview').addEventListener('click', () => atualizarPreview());

  // Navegação lateral
  $$('.sidebar a').forEach(a => {
    a.addEventListener('click', () => {
      $$('.sidebar a').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
    });
  });
}

// ---------- Form ----------
function bindForm() {
  document.addEventListener('input', (e) => {
    if (e.target.matches('input, select, textarea')) {
      salvarEstado();
    }
  });
}

function getValueByPath(root, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), root);
}

function setValueByPath(root, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  let cur = root;
  for (const k of keys) {
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[last] = value;
}

function coletarDados() {
  const dados = {};
  $$('input[name], select[name], textarea[name]').forEach(el => {
    if (el.closest('#tbl-amostra')) return;
    let v = el.value;
    if (el.type === 'number') v = el.value === '' ? '' : Number(el.value);
    if (el.type === 'checkbox') v = el.checked;
    setValueByPath(dados, el.name, v);
  });

  // Renomeia notas do avaliando (aval.nota.xxx -> avaliando.notaXxx) para
  // ficar mais natural ao homogeneizar.
  const aval = {
    area: areaAvaliando({ ...dados }),
    idade: Number(dados.vistoria?.idade) || 0,
    notaLocalizacao: dados.aval?.nota?.localizacao,
    notaPadrao: dados.aval?.nota?.padrao,
    notaConservacao: dados.aval?.nota?.conservacao,
    notaTransposicao: dados.aval?.nota?.transposicao
  };
  dados.avaliando = aval;

  dados.amostras = coletarAmostras();
  return dados;
}

function aplicarDados(dados) {
  $$('input[name], select[name], textarea[name]').forEach(el => {
    if (el.closest('#tbl-amostra')) return;
    const v = getValueByPath(dados, el.name);
    if (v === undefined || v === null) return;
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v;
  });

  // Amostras
  $('#tbl-amostra tbody').innerHTML = '';
  state.amostras = [];
  (dados.amostras || []).forEach(a => addAmostra(a));
  reindexarAmostras();
}

// ---------- Amostras ----------
function bindAmostras() {
  $('#btn-add-amostra').addEventListener('click', () => addAmostra());
  $('#tbl-amostra').addEventListener('click', (e) => {
    if (e.target.closest('.btn-remove')) {
      const tr = e.target.closest('tr');
      tr.remove();
      reindexarAmostras();
      salvarEstado();
    }
  });
  $('#tbl-amostra').addEventListener('input', () => salvarEstado());
}

function addAmostra(dados = {}) {
  const tpl = $('#tpl-amostra-row');
  const tr = tpl.content.firstElementChild.cloneNode(true);
  $('#tbl-amostra tbody').appendChild(tr);

  Object.entries(dados).forEach(([k, v]) => {
    const el = tr.querySelector(`[data-k="${k}"]`);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v ?? '';
  });
  reindexarAmostras();
}

function reindexarAmostras() {
  $$('#tbl-amostra tbody tr').forEach((tr, i) => {
    tr.querySelector('.idx').textContent = i + 1;
  });
}

function coletarAmostras() {
  return $$('#tbl-amostra tbody tr').map(tr => {
    const obj = {};
    tr.querySelectorAll('[data-k]').forEach(el => {
      let v = el.value;
      if (el.type === 'number') v = el.value === '' ? '' : Number(el.value);
      if (el.type === 'checkbox') v = el.checked;
      obj[el.dataset.k] = v;
    });
    return obj;
  });
}

// ---------- Cálculo ----------
function calcular(dados, opts = {}) {
  const silent = !!opts.silent;
  if (!dados.amostras?.length) {
    if (!silent) alert('Inclua pelo menos uma amostra de mercado.');
    return null;
  }
  if (!dados.avaliando.area) {
    if (!silent) alert('Informe a área do imóvel avaliando coerente com a variável de comparação.');
    return null;
  }

  const fatores = {
    oferta: dados.fator?.oferta,
    areaN: dados.fator?.areaN,
    depreciacaoAnual: dados.fator?.depreciacaoAnual,
    localizacao: dados.fator?.localizacao,
    padrao: dados.fator?.padrao,
    conservacao: dados.fator?.conservacao,
    transposicao: dados.fator?.transposicao
  };

  const homogeneizadas = homogenizarAmostras({
    amostras: dados.amostras,
    avaliando: dados.avaliando,
    fatores,
    variavel: dados.metodo?.variavel
  });

  const valoresHom = homogeneizadas.map(h => h.vuHom).filter(v => Number.isFinite(v) && v > 0);

  // Saneamento por Chauvenet
  const sanea = chauvenetOutliers(valoresHom);
  const valoresKept = sanea.kept;

  // Marca outliers nos itens
  if (sanea.removed.length) {
    const removidosIdx = new Set(sanea.removed.map(r => r.index));
    homogeneizadas.forEach((h, i) => { h.ehOutlier = removidosIdx.has(i); });
  }

  const m = mean(valoresKept);
  const med = median(valoresKept);
  const s = stdDev(valoresKept);
  const cv = coefVar(valoresKept);
  const ic = confidenceInterval80(valoresKept);

  const grauFund = grauFundamentacao({ nEfetivo: valoresKept.length, amplitude: ic.amplitude });
  const grauPrec = grauPrecisao(ic.amplitude);

  const valorUnit = m;
  const valorTotal = valorUnit * (dados.avaliando.area || 0);

  return {
    homogeneizadas,
    removidos: sanea.removed,
    nEfetivo: valoresKept.length,
    media: m,
    mediana: med,
    desvio: s,
    cv,
    icInf: ic.lower,
    icSup: ic.upper,
    amplitude: ic.amplitude,
    valorUnitario: valorUnit,
    valorTotal,
    grauFundamentacao: grauFund,
    grauPrecisao: grauPrec
  };
}

// ---------- UI Resultado ----------
const BRL = v => Number.isFinite(v) ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
const NUM = (v, d = 2) => Number.isFinite(v) ? v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—';
const PCT = v => Number.isFinite(v) ? v.toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '—';

function mostrarResultado(r, dados) {
  if (!r) return;
  $('#resultado-vazio').classList.add('hidden');
  $('#resultado').classList.remove('hidden');
  $('#kpi-media').textContent = BRL(r.media);
  $('#kpi-mediana').textContent = BRL(r.mediana);
  $('#kpi-desvio').textContent = BRL(r.desvio);
  $('#kpi-cv').textContent = PCT(r.cv);
  $('#kpi-ic-inf').textContent = BRL(r.icInf);
  $('#kpi-ic-sup').textContent = BRL(r.icSup);
  $('#kpi-ic-amp').textContent = PCT(r.amplitude);
  $('#kpi-outliers').textContent = r.removidos.length;
  $('#kpi-n').textContent = r.nEfetivo;
  $('#kpi-valor-unit').textContent = BRL(r.valorUnitario) + ' / m²';
  $('#kpi-valor-total').textContent = BRL(r.valorTotal);
  $('#kpi-grau-fund').textContent = r.grauFundamentacao.grau;
  $('#kpi-grau-prec').textContent = r.grauPrecisao.grau;
  $('#grau-detalhe').innerHTML = `
    Fundamentação: ${r.grauFundamentacao.motivo}.<br />
    Precisão: ${r.grauPrecisao.motivo}.
  `;
}

// ---------- Preview / Impressão ----------
function atualizarPreview() {
  const dados = coletarDados();
  const calculo = calcular(dados, { silent: true }) || state.ultimoCalculo;
  const html = renderLaudo({ dados, calculo });
  $('#preview').innerHTML = html;
  $('#laudo-print').innerHTML = html;
}

// ---------- Persistência ----------
function salvarEstado() {
  const dados = coletarDados();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

function carregarEstado() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    aplicarDados(JSON.parse(raw));
  } catch {
    /* ignora storage corrompido */
  }
}

// ---------- Exemplo ----------
function carregarExemplo() {
  const hoje = new Date().toISOString().slice(0, 10);
  const exemplo = {
    solicitante: {
      nome: 'João da Silva',
      documento: '123.456.789-00',
      endereco: 'Rua das Acácias, 123 — Centro — Curitiba/PR'
    },
    laudo: {
      finalidade: 'Garantia de financiamento bancário',
      objetivo: 'Valor de mercado para venda',
      pressupostos: 'A avaliação considera o imóvel livre e desembaraçado de quaisquer ônus, gravames, ações ou pendências, em condições normais de mercado, à data de referência indicada.',
      dataReferencia: hoje,
      localData: 'Curitiba, ' + new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    },
    imovel: {
      tipo: 'Apartamento',
      matricula: '12345 — 1º Ofício de Registro de Imóveis de Curitiba',
      endereco: 'Rua Marechal Deodoro, 1000 — Apto. 902',
      bairro: 'Centro',
      cidade: 'Curitiba/PR',
      areaTerreno: 0,
      areaConstruida: 85,
      areaPrivativa: 72,
      fracaoIdeal: '0,012345'
    },
    vistoria: {
      data: hoje,
      padrao: 'Normal/Médio',
      idade: 8,
      conservacao: 'c',
      dormitorios: 3,
      suites: 1,
      banheiros: 2,
      vagas: 1,
      andar: '9º',
      face: 'Norte',
      acabamentos: 'Piso laminado nos quartos e sala; porcelanato nas áreas molhadas; pintura látex; esquadrias de alumínio; instalações em bom estado.',
      lazer: 'Portaria 24h, salão de festas, piscina, academia, playground e churrasqueira coletiva.',
      equipamentos: 'Energia elétrica, água tratada, esgoto sanitário, pavimentação asfáltica, coleta de lixo, iluminação pública e transporte coletivo.'
    },
    mercado: {
      liquidez: 'Média',
      comportamento: 'Estável',
      ofertaDemanda: 'Equilíbrio',
      tendencia: 'Estabilidade',
      comentario: 'A região central de Curitiba apresenta liquidez média, com oferta diversificada de apartamentos de 2 e 3 dormitórios em prédios das décadas de 2000-2020.'
    },
    metodo: {
      tipo: 'MCDDM-Fatores',
      variavel: 'privativa'
    },
    fator: {
      oferta: 0.90,
      areaN: 0.25,
      depreciacaoAnual: 1.0,
      localizacao: 0.05,
      padrao: 0.05,
      conservacao: 0.04,
      transposicao: 0.03
    },
    aval: {
      nota: { localizacao: 7, padrao: 7, conservacao: 8, transposicao: 7 }
    },
    responsavel: {
      nome: 'Maria Oliveira',
      formacao: 'Engenheira Civil',
      registro: 'CREA-PR 123456 / IBAPE',
      cpf: '987.654.321-00',
      contato: 'Rua XV de Novembro, 500, sala 12 — Curitiba/PR — (41) 99999-0000'
    },
    amostras: [
      { endereco: 'Rua Cândido Lopes, 200 — Apto. 501', fonte: 'Portal imobiliário', tipo: 'Apartamento', area: 70, preco: 620000, oferta: true,  notaLocalizacao: 7, notaPadrao: 7, notaConservacao: 7, idade: 10, notaTransposicao: 7 },
      { endereco: 'Av. Sete de Setembro, 1500 — Apto. 1002', fonte: 'Imobiliária', tipo: 'Apartamento', area: 78, preco: 690000, oferta: true,  notaLocalizacao: 7, notaPadrao: 8, notaConservacao: 7, idade: 6, notaTransposicao: 7 },
      { endereco: 'Rua Voluntários da Pátria, 300 — Apto. 702', fonte: 'Corretor', tipo: 'Apartamento', area: 68, preco: 580000, oferta: true,  notaLocalizacao: 6, notaPadrao: 6, notaConservacao: 7, idade: 12, notaTransposicao: 7 },
      { endereco: 'Rua Marechal Deodoro, 850 — Apto. 401', fonte: 'Portal imobiliário', tipo: 'Apartamento', area: 80, preco: 720000, oferta: true,  notaLocalizacao: 8, notaPadrao: 7, notaConservacao: 8, idade: 5, notaTransposicao: 7 },
      { endereco: 'Rua Visconde de Nácar, 220 — Apto. 1101', fonte: 'Cartório / ITBI', tipo: 'Apartamento', area: 75, preco: 660000, oferta: false, notaLocalizacao: 7, notaPadrao: 7, notaConservacao: 8, idade: 7, notaTransposicao: 7 },
      { endereco: 'Rua Emiliano Perneta, 100 — Apto. 803', fonte: 'Imobiliária', tipo: 'Apartamento', area: 73, preco: 640000, oferta: true,  notaLocalizacao: 7, notaPadrao: 7, notaConservacao: 7, idade: 9, notaTransposicao: 7 }
    ]
  };
  aplicarDados(exemplo);
  salvarEstado();
  // Calcula automaticamente
  $('#btn-calcular').click();
}
