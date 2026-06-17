/* state.js — modelo de dados da vistoria e utilitários de estado. */
(function (global) {
  'use strict';

  /** Condições possíveis para cada item vistoriado (da melhor à pior). */
  const CONDICOES = [
    'Novo',
    'Ótimo',
    'Bom',
    'Regular',
    'Ruim',
    'Danificado',
    'N/A',
  ];

  /** Situações de um serviço de manutenção/limpeza. */
  const SITUACOES = ['Realizado', 'Pendente', 'Não aplicável'];

  /** Serviços de manutenção/limpeza sugeridos por padrão. */
  const MANUTENCAO_PADRAO = [
    'Limpeza geral',
    'Dedetização',
    'Pintura',
    'Revisão hidráulica',
    'Revisão elétrica',
    "Limpeza da caixa d'água",
    'Higienização do ar-condicionado',
  ];

  /**
   * Posição de uma condição na escala (0 = melhor). Quanto maior, pior.
   * Retorna -1 para "N/A" ou valores desconhecidos (fora da escala).
   */
  function ordemCondicao(cond) {
    const i = CONDICOES.indexOf(cond);
    return cond === 'N/A' ? -1 : i;
  }

  /** Gera um identificador curto e único o suficiente para o uso local. */
  function uid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  /** Data de hoje em formato YYYY-MM-DD para inputs do tipo date. */
  function hoje() {
    return new Date().toISOString().slice(0, 10);
  }

  const TERMO_PADRAO =
    'Declaro que vistoriei o imóvel acima identificado e que as condições ' +
    'aqui descritas refletem o estado em que ele se encontra nesta data. ' +
    'As partes reconhecem este laudo como parte integrante do contrato, ' +
    'comprometendo-se o locatário a devolver o imóvel nas mesmas condições, ' +
    'salvo o desgaste natural decorrente do uso normal.';

  /** Retorna um estado inicial vazio e válido. */
  function estadoInicial() {
    return {
      versao: 1,
      vistoria: { tipo: 'Entrada', data: hoje(), contrato: '', finalidade: 'Locação residencial' },
      imovel: {
        tipo: 'Apartamento',
        ocupacao: 'Desocupado',
        endereco: '',
        bairro: '',
        cidade: '',
        cep: '',
        area: '',
      },
      partes: {
        locador: '',
        locatario: '',
        imobiliaria: '',
        vistoriador: '',
        registro: '',
        contato: '',
      },
      medidores: {
        energiaNum: '',
        energiaLeitura: '',
        aguaNum: '',
        aguaLeitura: '',
        gasNum: '',
        gasLeitura: '',
      },
      chaves: { porta: '', portao: '', controles: '', cartoes: '', obs: '' },
      ambientes: [],
      inventario: [],
      manutencao: [],
      baseline: null,
      textos: { observacoes: '', termo: TERMO_PADRAO },
      assinaturas: { local: '', data: hoje() },
    };
  }

  /** Cria um item de inventário (móvel / eletrodoméstico). */
  function novoInventarioItem(descricao) {
    return {
      id: uid(),
      descricao: descricao || '',
      marca: '',
      modelo: '',
      serie: '',
      qtd: '1',
      estado: 'Bom',
      obs: '',
    };
  }

  /** Cria um item de manutenção/limpeza. */
  function novoManutencaoItem(servico) {
    return {
      id: uid(),
      servico: servico || '',
      situacao: 'Pendente',
      data: '',
      responsavel: '',
      obs: '',
    };
  }

  /** Cria um item de ambiente. */
  function novoItem(nome) {
    return { id: uid(), nome: nome || '', condicao: 'Bom', obs: '' };
  }

  /** Cria um ambiente com nome e lista opcional de nomes de itens. */
  function novoAmbiente(nome, itens) {
    return {
      id: uid(),
      nome: nome || '',
      itens: (itens || []).map(novoItem),
      fotos: [],
    };
  }

  /** Normaliza um nome para comparação (sem acentos, minúsculo, sem espaços extras). */
  function chaveNome(nome) {
    return String(nome || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Prepara um estado importado para ser guardado como baseline (vistoria de
   * entrada). Remove as fotos para economizar espaço — só interessam os itens.
   */
  function prepararBaseline(origem) {
    return {
      tipo: origem.vistoria ? origem.vistoria.tipo : '',
      data: origem.vistoria ? origem.vistoria.data : '',
      contrato: origem.vistoria ? origem.vistoria.contrato : '',
      endereco: origem.imovel ? origem.imovel.endereco : '',
      ambientes: (origem.ambientes || []).map((a) => ({
        nome: a.nome,
        itens: (a.itens || []).map((i) => ({ nome: i.nome, condicao: i.condicao, obs: i.obs })),
      })),
    };
  }

  /**
   * Compara o estado atual (saída) com o baseline (entrada).
   * Retorna { mudancas, mantidos, removidos } onde cada mudança tem
   * { ambiente, item, de, para, situacao }.
   */
  function comparar(baseline, estado) {
    const mudancas = [];
    let mantidos = 0;

    // Índice dos itens do baseline por ambiente -> item.
    const baseAmb = {};
    (baseline.ambientes || []).forEach((a) => {
      const mapaItens = {};
      (a.itens || []).forEach((i) => {
        mapaItens[chaveNome(i.nome)] = i;
      });
      baseAmb[chaveNome(a.nome)] = { nome: a.nome, itens: mapaItens, vistos: {} };
    });

    (estado.ambientes || []).forEach((amb) => {
      const base = baseAmb[chaveNome(amb.nome)];
      (amb.itens || []).forEach((it) => {
        const baseItem = base ? base.itens[chaveNome(it.nome)] : null;
        if (base && baseItem) base.vistos[chaveNome(it.nome)] = true;

        if (!base || !baseItem) {
          mudancas.push({ ambiente: amb.nome, item: it.nome, de: '—', para: it.condicao, situacao: 'Novo item' });
          return;
        }
        if (baseItem.condicao === it.condicao) {
          mantidos++;
          return;
        }
        const oa = ordemCondicao(baseItem.condicao);
        const ob = ordemCondicao(it.condicao);
        let situacao = 'Alterado';
        if (oa >= 0 && ob >= 0) situacao = ob > oa ? 'Piorou' : 'Melhorou';
        mudancas.push({ ambiente: amb.nome, item: it.nome, de: baseItem.condicao, para: it.condicao, situacao });
      });
    });

    // Itens que existiam na entrada e não foram encontrados na saída.
    const removidos = [];
    Object.keys(baseAmb).forEach((ka) => {
      const a = baseAmb[ka];
      Object.keys(a.itens).forEach((ki) => {
        if (!a.vistos[ki]) {
          const i = a.itens[ki];
          removidos.push({ ambiente: a.nome, item: i.nome, de: i.condicao, para: '—', situacao: 'Não encontrado' });
        }
      });
    });

    return { mudancas: mudancas.concat(removidos), mantidos };
  }

  /**
   * Lê um caminho "a.b.c" dentro de um objeto.
   */
  function getPath(obj, path) {
    return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
  }

  /**
   * Escreve um valor no caminho "a.b.c" de um objeto, criando os níveis.
   */
  function setPath(obj, path, value) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (cur[keys[i]] == null || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
  }

  global.Vistoria = global.Vistoria || {};
  Object.assign(global.Vistoria, {
    CONDICOES,
    SITUACOES,
    MANUTENCAO_PADRAO,
    TERMO_PADRAO,
    uid,
    hoje,
    ordemCondicao,
    estadoInicial,
    novoItem,
    novoAmbiente,
    novoInventarioItem,
    novoManutencaoItem,
    chaveNome,
    prepararBaseline,
    comparar,
    getPath,
    setPath,
  });
})(window);
