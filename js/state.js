/* state.js — modelo de dados da vistoria e utilitários de estado. */
(function (global) {
  'use strict';

  /** Condições possíveis para cada item vistoriado. */
  const CONDICOES = [
    'Novo',
    'Ótimo',
    'Bom',
    'Regular',
    'Ruim',
    'Danificado',
    'N/A',
  ];

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
      textos: { observacoes: '', termo: TERMO_PADRAO },
      assinaturas: { local: '', data: hoje() },
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
    TERMO_PADRAO,
    uid,
    hoje,
    estadoInicial,
    novoItem,
    novoAmbiente,
    getPath,
    setPath,
  });
})(window);
