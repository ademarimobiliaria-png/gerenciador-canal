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
            .map(
              (src) =>
                `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="Foto de ${esc(
                  amb.nome
                )}" /></a>`
            )
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

  /** Tabela do inventário de móveis/eletrodomésticos (ou '' se vazio). */
  function tabelaInventario(e) {
    if (!e.inventario || !e.inventario.length) return '';
    const linhas = e.inventario
      .map(
        (it) => `
        <tr>
          <td>${v(it.descricao)}</td>
          <td>${v(it.marca)}</td>
          <td>${v(it.modelo)}</td>
          <td>${v(it.serie)}</td>
          <td>${v(it.qtd)}</td>
          <td><span class="badge ${classeCond(it.estado)}">${v(it.estado)}</span></td>
          <td>${v(it.obs)}</td>
        </tr>`
      )
      .join('');
    return `
      <table class="amb-tabela">
        <thead>
          <tr><th>Descrição</th><th>Marca</th><th>Modelo</th><th>Nº de série</th><th>Qtd</th><th>Estado</th><th>Obs.</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>`;
  }

  /** Tabela de manutenção e limpeza (ou '' se vazio). */
  function tabelaManutencao(e) {
    if (!e.manutencao || !e.manutencao.length) return '';
    const linhas = e.manutencao
      .map(
        (m) => `
        <tr>
          <td>${v(m.servico)}</td>
          <td>${v(m.situacao)}</td>
          <td>${m.data ? dataBR(m.data) : '—'}</td>
          <td>${v(m.responsavel)}</td>
          <td>${v(m.obs)}</td>
        </tr>`
      )
      .join('');
    return `
      <table class="amb-tabela">
        <thead>
          <tr><th>Serviço</th><th>Situação</th><th>Data</th><th>Responsável</th><th>Obs.</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>`;
  }

  /** Bloco comparativo entrada × saída (ou '' se não houver baseline). */
  function tabelaComparativo(e) {
    if (!e.baseline) return '';
    const r = global.Vistoria.comparar(e.baseline, e);
    const b = e.baseline;
    const ref = `Referência: vistoria de <strong>${v(b.tipo)}</strong>${
      b.data ? ' de ' + dataBR(b.data) : ''
    }${b.endereco ? ' — ' + esc(b.endereco) : ''}.`;

    const linhas = r.mudancas
      .map(
        (m) => `
        <tr>
          <td>${v(m.ambiente)}</td>
          <td>${v(m.item)}</td>
          <td>${v(m.de)}</td>
          <td>${v(m.para)}</td>
          <td>${v(m.situacao)}</td>
        </tr>`
      )
      .join('');

    const corpo = r.mudancas.length
      ? `<table class="amb-tabela">
           <thead><tr><th>Ambiente</th><th>Item</th><th>Entrada</th><th>Saída</th><th>Situação</th></tr></thead>
           <tbody>${linhas}</tbody>
         </table>`
      : '<p class="texto-livre">Nenhuma diferença entre a entrada e esta vistoria.</p>';

    return `<p class="resumo">${ref} Itens mantidos: <strong>${r.mantidos}</strong>; alterações: <strong>${r.mudancas.length}</strong>.</p>${corpo}`;
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

    // Numeração dinâmica: as seções opcionais só entram quando há conteúdo.
    let n = 0;
    const sec = (titulo, inner, extraClasse) =>
      `<section class="doc-sec${extraClasse ? ' ' + extraClasse : ''}"><h2>${++n}. ${esc(
        titulo
      )}</h2>${inner}</section>`;

    const invHtml = tabelaInventario(e);
    const manutHtml = tabelaManutencao(e);
    const compHtml = tabelaComparativo(e);

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

      ${sec(
        'Identificação',
        `${row('Tipo de imóvel', v(e.imovel.tipo))}
        ${row('Estado de ocupação', v(e.imovel.ocupacao))}
        ${row('Área', e.imovel.area ? esc(e.imovel.area) + ' m²' : '—')}
        ${row('Endereço', v(e.imovel.endereco))}
        ${row('Bairro / Cidade', v(e.imovel.bairro) + ' — ' + v(e.imovel.cidade))}
        ${row('CEP', v(e.imovel.cep))}`
      )}

      ${sec(
        'Partes envolvidas',
        `${row('Locador / Proprietário', v(e.partes.locador))}
        ${row('Locatário / Inquilino', v(e.partes.locatario))}
        ${row('Imobiliária', v(e.partes.imobiliaria))}
        ${row('Vistoriador', v(e.partes.vistoriador) + (e.partes.registro ? ' (' + esc(e.partes.registro) + ')' : ''))}
        ${row('Contato', v(e.partes.contato))}`
      )}

      ${sec(
        'Medidores e chaves',
        `${row('Energia', v(e.medidores.energiaNum) + ' — leitura ' + v(e.medidores.energiaLeitura))}
        ${row('Água', v(e.medidores.aguaNum) + ' — leitura ' + v(e.medidores.aguaLeitura))}
        ${row('Gás', v(e.medidores.gasNum) + ' — leitura ' + v(e.medidores.gasLeitura))}
        ${row(
          'Chaves / controles',
          `Porta: ${v(e.chaves.porta)} • Portão: ${v(e.chaves.portao)} • Controles: ${v(
            e.chaves.controles
          )} • Cartões: ${v(e.chaves.cartoes)}`
        )}
        ${e.chaves.obs ? row('Obs. chaves', esc(e.chaves.obs)) : ''}`
      )}

      ${sec(
        'Ambientes vistoriados',
        `<p class="resumo">Total de itens avaliados: <strong>${totalItens}</strong> ${resumoHtml}</p>${ambientesHtml}`
      )}

      ${invHtml ? sec('Móveis e eletrodomésticos', invHtml) : ''}
      ${manutHtml ? sec('Manutenção e limpeza', manutHtml) : ''}
      ${compHtml ? sec('Comparativo entrada × saída', compHtml) : ''}

      ${sec(
        'Observações gerais',
        `<p class="texto-livre">${v(e.textos.observacoes).replace(/\n/g, '<br />')}</p>
        <h3>Termo de responsabilidade</h3>
        <p class="texto-livre">${v(e.textos.termo).replace(/\n/g, '<br />')}</p>`
      )}

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
