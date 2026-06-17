/* report.js — gera o HTML do laudo de vistoria para visualização e impressão. */
(function (global) {
  'use strict';

  function esc(v) {
    if (v == null) return '';
    return String(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function dataBR(iso) {
    if (!iso) return '—';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return esc(iso);
    return `${m[3]}/${m[2]}/${m[1]}`;
  }

  function v(x) {
    return x == null || x === '' ? '—' : esc(x);
  }

  /** Linha de definição "rótulo: valor". */
  function row(label, value) {
    return `<div class="d-row"><span class="d-label">${esc(label)}</span><span class="d-value">${value}</span></div>`;
  }

  function classeCond(cond) {
    const map = {
      Novo: 'cond-otimo',
      'Ótimo': 'cond-otimo',
      Bom: 'cond-bom',
      Regular: 'cond-regular',
      Ruim: 'cond-ruim',
      Danificado: 'cond-ruim',
      'N/A': 'cond-na',
    };
    return map[cond] || 'cond-na';
  }

  function resumoCondicoes(estado) {
    const cont = {};
    estado.ambientes.forEach((amb) => {
      amb.itens.forEach((it) => {
        cont[it.condicao] = (cont[it.condicao] || 0) + 1;
      });
    });
    return cont;
  }

  function tabelaAmbiente(amb) {
    const linhas = amb.itens
      .map(
        (it) => `
        <tr>
          <td>${v(it.nome)}</td>
          <td><span class="badge ${classeCond(it.condicao)}">${v(it.condicao)}</span></td>
          <td>${v(it.obs)}</td>
        </tr>`
      )
      .join('');

    const corpo =
      amb.itens.length > 0
        ? linhas
        : '<tr><td colspan="3" class="muted">Nenhum item cadastrado.</td></tr>';

    const fotos =
      amb.fotos && amb.fotos.length
        ? `<div class="fotos">${amb.fotos
            .map((src) => `<img src="${src}" alt="Foto de ${esc(amb.nome)}" />`)
            .join('')}</div>`
        : '';

    return `
      <section class="amb-bloco">
        <h3>${v(amb.nome)}</h3>
        <table class="amb-tabela">
          <thead>
            <tr><th>Item</th><th>Condição</th><th>Observações</th></tr>
          </thead>
          <tbody>${corpo}</tbody>
        </table>
        ${fotos}
      </section>`;
  }

  function assinatura(nome, papel) {
    return `
      <div class="ass-bloco">
        <div class="ass-linha"></div>
        <div class="ass-nome">${v(nome)}</div>
        <div class="ass-papel">${esc(papel)}</div>
      </div>`;
  }

  /** Monta o HTML completo do laudo. */
  function render(estado) {
    const e = estado;
    const resumo = resumoCondicoes(e);
    const totalItens = Object.values(resumo).reduce((a, b) => a + b, 0);
    const resumoHtml = global.Vistoria.CONDICOES.filter((c) => resumo[c])
      .map((c) => `<span class="badge ${classeCond(c)}">${esc(c)}: ${resumo[c]}</span>`)
      .join(' ');

    const ambientesHtml = e.ambientes.length
      ? e.ambientes.map(tabelaAmbiente).join('')
      : '<p class="muted">Nenhum ambiente vistoriado.</p>';

    return `
    <article class="doc">
      <header class="doc-capa">
        <h1>Laudo de Vistoria de Imóvel</h1>
        <p class="doc-sub">Vistoria de ${v(e.vistoria.tipo)} — ${v(e.vistoria.finalidade)}</p>
        <p class="doc-end">${v(e.imovel.tipo)} • ${v(e.imovel.endereco)}<br />
          ${v(e.imovel.bairro)} — ${v(e.imovel.cidade)} • CEP ${v(e.imovel.cep)}</p>
        <p class="doc-data">Data da vistoria: <strong>${dataBR(e.vistoria.data)}</strong>
          ${e.vistoria.contrato ? ' • Contrato ' + esc(e.vistoria.contrato) : ''}</p>
      </header>

      <section class="doc-sec">
        <h2>1. Identificação</h2>
        ${row('Tipo de imóvel', v(e.imovel.tipo))}
        ${row('Estado de ocupação', v(e.imovel.ocupacao))}
        ${row('Área', e.imovel.area ? esc(e.imovel.area) + ' m²' : '—')}
        ${row('Endereço', v(e.imovel.endereco))}
        ${row('Bairro / Cidade', v(e.imovel.bairro) + ' — ' + v(e.imovel.cidade))}
        ${row('CEP', v(e.imovel.cep))}
      </section>

      <section class="doc-sec">
        <h2>2. Partes envolvidas</h2>
        ${row('Locador / Proprietário', v(e.partes.locador))}
        ${row('Locatário / Inquilino', v(e.partes.locatario))}
        ${row('Imobiliária', v(e.partes.imobiliaria))}
        ${row('Vistoriador', v(e.partes.vistoriador) + (e.partes.registro ? ' (' + esc(e.partes.registro) + ')' : ''))}
        ${row('Contato', v(e.partes.contato))}
      </section>

      <section class="doc-sec">
        <h2>3. Medidores e chaves</h2>
        ${row('Energia', v(e.medidores.energiaNum) + ' — leitura ' + v(e.medidores.energiaLeitura))}
        ${row('Água', v(e.medidores.aguaNum) + ' — leitura ' + v(e.medidores.aguaLeitura))}
        ${row('Gás', v(e.medidores.gasNum) + ' — leitura ' + v(e.medidores.gasLeitura))}
        ${row(
          'Chaves / controles',
          `Porta: ${v(e.chaves.porta)} • Portão: ${v(e.chaves.portao)} • Controles: ${v(
            e.chaves.controles
          )} • Cartões: ${v(e.chaves.cartoes)}`
        )}
        ${e.chaves.obs ? row('Obs. chaves', esc(e.chaves.obs)) : ''}
      </section>

      <section class="doc-sec">
        <h2>4. Ambientes vistoriados</h2>
        <p class="resumo">Total de itens avaliados: <strong>${totalItens}</strong> ${resumoHtml}</p>
        ${ambientesHtml}
      </section>

      <section class="doc-sec">
        <h2>5. Observações gerais</h2>
        <p class="texto-livre">${v(e.textos.observacoes).replace(/\n/g, '<br />')}</p>
        <h3>Termo de responsabilidade</h3>
        <p class="texto-livre">${v(e.textos.termo).replace(/\n/g, '<br />')}</p>
      </section>

      <section class="doc-sec doc-assinaturas">
        <p class="local-data">${v(e.assinaturas.local)}, ${dataBR(e.assinaturas.data)}.</p>
        <div class="assinaturas-grid">
          ${assinatura(e.partes.vistoriador, 'Vistoriador responsável')}
          ${assinatura(e.partes.locador, 'Locador / Proprietário')}
          ${assinatura(e.partes.locatario, 'Locatário / Inquilino')}
        </div>
      </section>
    </article>`;
  }

  global.Vistoria = global.Vistoria || {};
  global.Vistoria.report = { render };
})(window);
