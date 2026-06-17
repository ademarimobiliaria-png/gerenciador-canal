/* storage.js — persistência do estado no localStorage do navegador. */
(function (global) {
  'use strict';

  const KEY = 'vistoria-imoveis:v1';

  function salvar(estado) {
    try {
      localStorage.setItem(KEY, JSON.stringify(estado));
      return true;
    } catch (err) {
      // QuotaExceededError costuma ocorrer quando há muitas fotos em base64.
      console.warn('Não foi possível salvar no navegador:', err);
      return false;
    }
  }

  function carregar() {
    try {
      const bruto = localStorage.getItem(KEY);
      if (!bruto) return null;
      return JSON.parse(bruto);
    } catch (err) {
      console.warn('Estado salvo inválido, ignorando:', err);
      return null;
    }
  }

  function limpar() {
    try {
      localStorage.removeItem(KEY);
    } catch (err) {
      /* ignore */
    }
  }

  global.Vistoria = global.Vistoria || {};
  global.Vistoria.storage = { salvar, carregar, limpar };
})(window);
