/* sample.js — caso de exemplo (vistoria de entrada de um apartamento). */
(function (global) {
  'use strict';

  function carregarExemplo() {
    const V = global.Vistoria;
    const e = V.estadoInicial();

    e.vistoria = {
      tipo: 'Entrada',
      data: '2026-06-15',
      contrato: 'LOC-2026-018',
      finalidade: 'Locação residencial',
    };
    e.imovel = {
      tipo: 'Apartamento',
      ocupacao: 'Desocupado',
      endereco: 'Rua das Araucárias, 480 — apto 72, bloco B',
      bairro: 'Água Verde',
      cidade: 'Curitiba / PR',
      cep: '80240-000',
      area: '68',
    };
    e.partes = {
      locador: 'Helena Marques de Souza',
      locatario: 'Rafael Oliveira Lima',
      imobiliaria: 'Ademari Imobiliária',
      vistoriador: 'Ana Paula Ferreira',
      registro: 'CRECI/PR 12.345',
      contato: '(41) 99999-0000 — vistorias@ademari.com.br',
    };
    e.medidores = {
      energiaNum: 'COPEL 8842177',
      energiaLeitura: '13.420 kWh',
      aguaNum: 'SANEPAR 552190',
      aguaLeitura: '0871 m³',
      gasNum: '—',
      gasLeitura: '—',
    };
    e.chaves = { porta: '2', portao: '1', controles: '1', cartoes: '2', obs: 'Chaveiro identificado entregue ao locatário.' };

    const mk = V.novoAmbiente;
    const sala = mk('Sala de estar/jantar', V.templates.itensPara('Sala'));
    setCond(sala, 'Pintura', 'Ótimo', 'Repintada antes da locação.');
    setCond(sala, 'Piso', 'Bom', 'Porcelanato sem trincas; leve risco junto à varanda.');

    const cozinha = mk('Cozinha', V.templates.itensPara('Cozinha'));
    setCond(cozinha, 'Bancada / Pia', 'Bom', 'Granito íntegro.');
    setCond(cozinha, 'Torneira', 'Regular', 'Pequeno gotejamento na base — verificar vedação.');

    const quarto1 = mk('Dormitório 1 (suíte)', V.templates.itensPara('Quarto'));
    setCond(quarto1, 'Armário embutido', 'Bom', '6 portas, dobradiças firmes.');

    const quarto2 = mk('Dormitório 2', V.templates.itensPara('Quarto'));

    const banheiro = mk('Banheiro social', V.templates.itensPara('Banheiro'));
    setCond(banheiro, 'Box / Vidro', 'Ótimo', 'Vidro temperado, sem trincas.');
    setCond(banheiro, 'Azulejos', 'Bom', 'Rejunte limpo.');

    const area = mk('Área de serviço', V.templates.itensPara('Área de serviço'));
    const varanda = mk('Varanda', V.templates.itensPara('Varanda'));

    e.ambientes = [sala, cozinha, quarto1, quarto2, banheiro, area, varanda];

    // Inventário (imóvel semimobiliado).
    const inv = (descricao, marca, modelo, serie, qtd, estado, obs) => {
      const it = V.novoInventarioItem(descricao);
      it.marca = marca || '';
      it.modelo = modelo || '';
      it.serie = serie || '';
      it.qtd = qtd || '1';
      it.estado = estado || 'Bom';
      it.obs = obs || '';
      return it;
    };
    e.inventario = [
      inv('Fogão 4 bocas', 'Brastemp', 'BFS4NAR', 'BR-9921-7741', '1', 'Bom', 'Acende todas as bocas.'),
      inv('Geladeira frost free', 'Electrolux', 'DF44', 'EL-5520-1180', '1', 'Ótimo', 'Borracha íntegra.'),
      inv('Cooktop / coifa', 'Suggar', 'CF80', 'SG-3300-0091', '1', 'Bom', ''),
      inv('Ar-condicionado split', 'LG', 'Dual Inverter 12k', 'LG-7781-4420', '1', 'Regular', 'Filtro a limpar.'),
    ];

    // Manutenção e limpeza.
    const man = (servico, situacao, data, responsavel, obs) => {
      const m = V.novoManutencaoItem(servico);
      m.situacao = situacao || 'Pendente';
      m.data = data || '';
      m.responsavel = responsavel || '';
      m.obs = obs || '';
      return m;
    };
    e.manutencao = [
      man('Limpeza geral', 'Realizado', '2026-06-13', 'Equipe Ademari', 'Imóvel entregue limpo.'),
      man('Dedetização', 'Realizado', '2026-06-12', 'DedControl', 'Garantia de 6 meses.'),
      man('Pintura', 'Realizado', '2026-06-10', 'Pinturas Silva', 'Paredes e teto.'),
      man('Revisão hidráulica', 'Pendente', '', '', 'Revisar vedação da torneira da cozinha.'),
      man('Revisão elétrica', 'Realizado', '2026-06-11', 'Eletro Curitiba', 'Disjuntores e tomadas OK.'),
    ];

    e.textos.observacoes =
      'Imóvel entregue limpo e pintado. Lâmpadas funcionando em todos os ambientes. ' +
      'Pendência única: revisar vedação da torneira da cozinha em até 10 dias.';

    e.assinaturas = { local: 'Curitiba / PR', data: '2026-06-15' };
    return e;
  }

  /** Ajusta a condição e a observação de um item pelo nome. */
  function setCond(ambiente, nomeItem, condicao, obs) {
    const item = ambiente.itens.find((i) => i.nome === nomeItem);
    if (item) {
      item.condicao = condicao;
      item.obs = obs || '';
    }
  }

  global.Vistoria = global.Vistoria || {};
  global.Vistoria.sample = { carregarExemplo };
})(window);
