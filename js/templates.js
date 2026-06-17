/* templates.js — modelos de itens por tipo de ambiente. */
(function (global) {
  'use strict';

  const COMUNS = ['Piso', 'Paredes', 'Teto', 'Pintura', 'Portas', 'Janelas', 'Iluminação / Tomadas'];

  const TEMPLATES = {
    Sala: COMUNS.concat(['Rodapés', 'Interruptores']),
    Cozinha: COMUNS.concat([
      'Bancada / Pia',
      'Torneira',
      'Armários',
      'Azulejos',
      'Sifão / Ralo',
      'Pontos de gás',
    ]),
    Quarto: COMUNS.concat(['Rodapés', 'Armário embutido', 'Tomadas']),
    Banheiro: COMUNS.concat([
      'Vaso sanitário',
      'Pia / Cuba',
      'Torneira',
      'Chuveiro / Ducha',
      'Box / Vidro',
      'Azulejos',
      'Ralo',
      'Espelho',
    ]),
    'Área de serviço': COMUNS.concat(['Tanque', 'Torneira', 'Pontos de água', 'Ralo']),
    Varanda: ['Piso', 'Paredes', 'Teto', 'Pintura', 'Guarda-corpo', 'Iluminação'],
    Garagem: ['Piso', 'Paredes', 'Teto', 'Portão', 'Iluminação', 'Demarcação de vaga'],
  };

  /** Devolve a lista de itens para um nome de modelo (ou lista vazia). */
  function itensPara(nome) {
    return (TEMPLATES[nome] || []).slice();
  }

  global.Vistoria = global.Vistoria || {};
  global.Vistoria.templates = { TEMPLATES, itensPara };
})(window);
