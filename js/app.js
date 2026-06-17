/* app.js — controlador principal: formulário, persistência e fluxo. */
(function (global) {
  'use strict';

  const V = global.Vistoria;
  let estado = V.storage.carregar() || V.estadoInicial();

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));

  /* ---------- persistência ---------- */
  let timerSalvar = null;
  function agendarSalvar() {
    clearTimeout(timerSalvar);
    timerSalvar = setTimeout(() => {
      const ok = V.storage.salvar(estado);
      const hint = $('#save-hint');
      if (hint) {
        hint.textContent = ok
          ? 'Salvo automaticamente no navegador'
          : 'Não foi possível salvar (armazenamento cheio — exporte o JSON)';
        hint.classList.toggle('warn', !ok);
      }
    }, 250);
  }

  /* ---------- campos estáticos (data-bind) ---------- */
  function pintarCamposEstaticos() {
    $$('[data-bind]').forEach((el) => {
      const path = el.getAttribute('data-bind');
      const val = V.getPath(estado, path);
      el.value = val == null ? '' : val;
    });
  }

  function ligarCamposEstaticos() {
    $$('[data-bind]').forEach((el) => {
      const path = el.getAttribute('data-bind');
      el.addEventListener('input', () => {
        V.setPath(estado, path, el.value);
        agendarSalvar();
      });
    });
  }

  /* ---------- ambientes (dinâmicos) ---------- */
  const listaEl = () => $('#ambientes-list');

  function optionsCondicao(sel) {
    return V.CONDICOES.map(
      (c) => `<option value="${c}"${c === sel ? ' selected' : ''}>${c}</option>`
    ).join('');
  }

  function renderAmbientes() {
    const cont = listaEl();
    if (!estado.ambientes.length) {
      cont.innerHTML =
        '<p class="muted empty">Nenhum ambiente ainda. Use os botões acima para começar.</p>';
      return;
    }
    cont.innerHTML = estado.ambientes
      .map((amb, idx) => {
        const itensHtml = amb.itens
          .map(
            (it) => `
          <div class="item-row" data-item="${it.id}">
            <input type="text" class="item-nome" value="${attr(it.nome)}" placeholder="Item" data-k="nome" />
            <select class="item-cond" data-k="condicao">${optionsCondicao(it.condicao)}</select>
            <input type="text" class="item-obs" value="${attr(it.obs)}" placeholder="Observação" data-k="obs" />
            <button type="button" class="btn icon del-item" title="Remover item">✕</button>
          </div>`
          )
          .join('');

        const fotosHtml = (amb.fotos || [])
          .map(
            (src, fi) => `
          <div class="foto-thumb">
            <img src="${src}" alt="Foto ${fi + 1}" title="Clique para ampliar" />
            <button type="button" class="del-foto" data-foto="${fi}" title="Remover foto">✕</button>
          </div>`
          )
          .join('');

        return `
        <div class="ambiente" data-amb="${amb.id}">
          <div class="ambiente-head">
            <input type="text" class="amb-nome" value="${attr(amb.nome)}" placeholder="Nome do ambiente" />
            <div class="ambiente-acoes">
              <button type="button" class="btn small add-item">+ item</button>
              <button type="button" class="btn small ghost mover" data-dir="-1" ${idx === 0 ? 'disabled' : ''}>↑</button>
              <button type="button" class="btn small ghost mover" data-dir="1" ${idx === estado.ambientes.length - 1 ? 'disabled' : ''}>↓</button>
              <button type="button" class="btn small danger del-amb">Remover</button>
            </div>
          </div>
          <div class="itens">${itensHtml || '<p class="muted">Sem itens.</p>'}</div>
          <div class="fotos-area">
            <label class="btn small ghost foto-label">
              + fotos
              <input type="file" class="foto-input" accept="image/*" multiple hidden />
            </label>
            <div class="fotos-grid">${fotosHtml}</div>
          </div>
        </div>`;
      })
      .join('');
  }

  function attr(v) {
    return String(v == null ? '' : v).replace(/"/g, '&quot;');
  }

  function ambientePorEl(el) {
    const wrap = el.closest('[data-amb]');
    if (!wrap) return null;
    const id = wrap.getAttribute('data-amb');
    return estado.ambientes.find((a) => a.id === id) || null;
  }

  function adicionarAmbiente(templateNome) {
    const nome = templateNome || '';
    const itens = templateNome ? V.templates.itensPara(templateNome) : [];
    estado.ambientes.push(V.novoAmbiente(nome, itens));
    agendarSalvar();
    renderAmbientes();
  }

  /* Delegação de eventos dentro da lista de ambientes. */
  function ligarAmbientes() {
    const cont = listaEl();

    cont.addEventListener('input', (ev) => {
      const t = ev.target;
      const amb = ambientePorEl(t);
      if (!amb) return;

      if (t.classList.contains('amb-nome')) {
        amb.nome = t.value;
        agendarSalvar();
        return;
      }
      const itemRow = t.closest('[data-item]');
      if (itemRow) {
        const item = amb.itens.find((i) => i.id === itemRow.getAttribute('data-item'));
        if (item && t.dataset.k) {
          item[t.dataset.k] = t.value;
          agendarSalvar();
        }
      }
    });

    cont.addEventListener('change', (ev) => {
      const t = ev.target;
      if (t.classList.contains('item-cond')) {
        const amb = ambientePorEl(t);
        const itemRow = t.closest('[data-item]');
        if (amb && itemRow) {
          const item = amb.itens.find((i) => i.id === itemRow.getAttribute('data-item'));
          if (item) {
            item.condicao = t.value;
            agendarSalvar();
          }
        }
      } else if (t.classList.contains('foto-input')) {
        manipularFotos(t);
      }
    });

    cont.addEventListener('click', (ev) => {
      const t = ev.target;
      const amb = ambientePorEl(t);

      if (t.classList.contains('add-item') && amb) {
        amb.itens.push(V.novoItem(''));
        agendarSalvar();
        renderAmbientes();
      } else if (t.classList.contains('del-item') && amb) {
        const row = t.closest('[data-item]');
        amb.itens = amb.itens.filter((i) => i.id !== row.getAttribute('data-item'));
        agendarSalvar();
        renderAmbientes();
      } else if (t.classList.contains('del-amb') && amb) {
        if (confirm('Remover este ambiente e todos os seus itens?')) {
          estado.ambientes = estado.ambientes.filter((a) => a.id !== amb.id);
          agendarSalvar();
          renderAmbientes();
        }
      } else if (t.classList.contains('mover') && amb) {
        moverAmbiente(amb, parseInt(t.getAttribute('data-dir'), 10));
      } else if (t.classList.contains('del-foto') && amb) {
        const fi = parseInt(t.getAttribute('data-foto'), 10);
        amb.fotos.splice(fi, 1);
        agendarSalvar();
        renderAmbientes();
      } else if (t.tagName === 'IMG' && t.closest('.foto-thumb')) {
        abrirFoto(t.src);
      }
    });
  }

  function moverAmbiente(amb, dir) {
    const i = estado.ambientes.indexOf(amb);
    const j = i + dir;
    if (j < 0 || j >= estado.ambientes.length) return;
    const arr = estado.ambientes;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    agendarSalvar();
    renderAmbientes();
  }

  function manipularFotos(input) {
    const amb = ambientePorEl(input);
    if (!amb) return;
    const files = Array.prototype.slice.call(input.files || []);
    if (!files.length) return;
    Promise.all(
      files.map((f) =>
        V.photos.processar(f).catch((err) => {
          console.warn('Foto ignorada:', err);
          return null;
        })
      )
    ).then((urls) => {
      amb.fotos = amb.fotos.concat(urls.filter(Boolean));
      agendarSalvar();
      renderAmbientes();
    });
    input.value = '';
  }

  /* ---------- inventário (móveis / eletrodomésticos) ---------- */
  function optionsCond(sel) {
    return optionsCondicao(sel);
  }

  function renderInventario() {
    const cont = $('#inventario-list');
    if (!cont) return;
    if (!estado.inventario.length) {
      cont.innerHTML = '<p class="muted empty">Nenhum item de inventário.</p>';
      return;
    }
    cont.innerHTML = estado.inventario
      .map(
        (it) => `
        <div class="inv-row" data-inv="${it.id}">
          <input type="text" value="${attr(it.descricao)}" placeholder="Descrição" data-k="descricao" class="inv-desc" />
          <input type="text" value="${attr(it.marca)}" placeholder="Marca" data-k="marca" />
          <input type="text" value="${attr(it.modelo)}" placeholder="Modelo" data-k="modelo" />
          <input type="text" value="${attr(it.serie)}" placeholder="Nº de série" data-k="serie" />
          <input type="number" min="0" step="1" value="${attr(it.qtd)}" placeholder="Qtd" data-k="qtd" class="inv-qtd" />
          <select data-k="estado">${optionsCond(it.estado)}</select>
          <input type="text" value="${attr(it.obs)}" placeholder="Observação" data-k="obs" />
          <button type="button" class="btn icon del-inv" title="Remover item">✕</button>
        </div>`
      )
      .join('');
  }

  function ligarInventario() {
    const cont = $('#inventario-list');
    const upd = (ev) => {
      const row = ev.target.closest('[data-inv]');
      if (!row) return;
      const item = estado.inventario.find((i) => i.id === row.getAttribute('data-inv'));
      if (item && ev.target.dataset.k) {
        item[ev.target.dataset.k] = ev.target.value;
        agendarSalvar();
      }
    };
    cont.addEventListener('input', upd);
    cont.addEventListener('change', upd);
    cont.addEventListener('click', (ev) => {
      if (ev.target.classList.contains('del-inv')) {
        const row = ev.target.closest('[data-inv]');
        estado.inventario = estado.inventario.filter((i) => i.id !== row.getAttribute('data-inv'));
        agendarSalvar();
        renderInventario();
      }
    });
    $('#btn-add-inv').addEventListener('click', () => {
      estado.inventario.push(V.novoInventarioItem(''));
      agendarSalvar();
      renderInventario();
    });
  }

  /* ---------- manutenção e limpeza ---------- */
  function optionsSituacao(sel) {
    return V.SITUACOES.map(
      (s) => `<option value="${s}"${s === sel ? ' selected' : ''}>${s}</option>`
    ).join('');
  }

  function renderManutencao() {
    const cont = $('#manutencao-list');
    if (!cont) return;
    if (!estado.manutencao.length) {
      cont.innerHTML = '<p class="muted empty">Nenhum serviço cadastrado.</p>';
      return;
    }
    cont.innerHTML = estado.manutencao
      .map(
        (m) => `
        <div class="manut-row" data-manut="${m.id}">
          <input type="text" value="${attr(m.servico)}" placeholder="Serviço" data-k="servico" class="manut-serv" />
          <select data-k="situacao">${optionsSituacao(m.situacao)}</select>
          <input type="date" value="${attr(m.data)}" data-k="data" />
          <input type="text" value="${attr(m.responsavel)}" placeholder="Responsável" data-k="responsavel" />
          <input type="text" value="${attr(m.obs)}" placeholder="Observação" data-k="obs" />
          <button type="button" class="btn icon del-manut" title="Remover serviço">✕</button>
        </div>`
      )
      .join('');
  }

  function ligarManutencao() {
    const cont = $('#manutencao-list');
    const upd = (ev) => {
      const row = ev.target.closest('[data-manut]');
      if (!row) return;
      const item = estado.manutencao.find((i) => i.id === row.getAttribute('data-manut'));
      if (item && ev.target.dataset.k) {
        item[ev.target.dataset.k] = ev.target.value;
        agendarSalvar();
      }
    };
    cont.addEventListener('input', upd);
    cont.addEventListener('change', upd);
    cont.addEventListener('click', (ev) => {
      if (ev.target.classList.contains('del-manut')) {
        const row = ev.target.closest('[data-manut]');
        estado.manutencao = estado.manutencao.filter((i) => i.id !== row.getAttribute('data-manut'));
        agendarSalvar();
        renderManutencao();
      }
    });
    $('#btn-add-manut').addEventListener('click', () => {
      estado.manutencao.push(V.novoManutencaoItem(''));
      agendarSalvar();
      renderManutencao();
    });
    $('#btn-manut-padrao').addEventListener('click', () => {
      V.MANUTENCAO_PADRAO.forEach((nome) => {
        const existe = estado.manutencao.some((m) => m.servico === nome);
        if (!existe) estado.manutencao.push(V.novoManutencaoItem(nome));
      });
      agendarSalvar();
      renderManutencao();
    });
  }

  /* ---------- comparativo entrada × saída ---------- */
  function renderComparativo() {
    const info = $('#comparativo-info');
    const btnLimpar = $('#btn-limpar-baseline');
    if (!info) return;
    if (!estado.baseline) {
      info.innerHTML =
        '<p class="muted">Nenhuma vistoria de entrada carregada para comparação.</p>';
      if (btnLimpar) btnLimpar.hidden = true;
      return;
    }
    if (btnLimpar) btnLimpar.hidden = false;
    const b = estado.baseline;
    const r = V.comparar(b, estado);
    const piorou = r.mudancas.filter((m) => m.situacao === 'Piorou').length;
    const novos = r.mudancas.filter((m) => m.situacao === 'Novo item').length;
    const naoEnc = r.mudancas.filter((m) => m.situacao === 'Não encontrado').length;

    const linhas = r.mudancas
      .map(
        (m) => `
        <tr class="sit-${m.situacao === 'Piorou' ? 'pior' : m.situacao === 'Melhorou' ? 'melhor' : 'neutro'}">
          <td>${escAttr(m.ambiente)}</td>
          <td>${escAttr(m.item)}</td>
          <td>${escAttr(m.de)}</td>
          <td>${escAttr(m.para)}</td>
          <td>${escAttr(m.situacao)}</td>
        </tr>`
      )
      .join('');

    info.innerHTML = `
      <p class="baseline-ref">
        Referência: vistoria de <strong>${escAttr(b.tipo || '—')}</strong>
        ${b.data ? 'de ' + escAttr(b.data) : ''}
        ${b.endereco ? '• ' + escAttr(b.endereco) : ''}
      </p>
      <p class="resumo-comp">
        <span class="badge cond-bom">Mantidos: ${r.mantidos}</span>
        <span class="badge cond-ruim">Pioraram: ${piorou}</span>
        <span class="badge cond-regular">Novos: ${novos}</span>
        <span class="badge cond-na">Não encontrados: ${naoEnc}</span>
      </p>
      ${
        r.mudancas.length
          ? `<table class="comp-tabela">
              <thead><tr><th>Ambiente</th><th>Item</th><th>Entrada</th><th>Saída</th><th>Situação</th></tr></thead>
              <tbody>${linhas}</tbody>
             </table>`
          : '<p class="muted">Nenhuma diferença encontrada entre entrada e saída.</p>'
      }`;
  }

  function escAttr(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function ligarComparativo() {
    $('#file-baseline').addEventListener('change', (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const dados = JSON.parse(reader.result);
          if (!dados || !Array.isArray(dados.ambientes)) throw new Error('Estrutura inválida.');
          estado.baseline = V.prepararBaseline(dados);
          agendarSalvar();
          renderComparativo();
        } catch (err) {
          alert('Não foi possível ler a vistoria de entrada: ' + err.message);
        }
        ev.target.value = '';
      };
      reader.readAsText(file);
    });
    $('#btn-limpar-baseline').addEventListener('click', () => {
      estado.baseline = null;
      agendarSalvar();
      renderComparativo();
    });
  }

  /* ---------- lightbox de fotos ---------- */
  function abrirFoto(src) {
    const modal = $('#foto-modal');
    const img = $('#foto-modal-img');
    if (!modal || !img) return;
    img.src = src;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function fecharFoto() {
    const modal = $('#foto-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    $('#foto-modal-img').src = '';
  }

  function ligarLightbox() {
    const modal = $('#foto-modal');
    if (!modal) return;
    // Fecha ao clicar no fundo ou no botão (mas não ao clicar na própria imagem).
    modal.addEventListener('click', (ev) => {
      if (ev.target.id !== 'foto-modal-img') fecharFoto();
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && modal.classList.contains('open')) fecharFoto();
    });
  }

  /* ---------- ações do topo ---------- */
  function ligarTopo() {
    $('#btn-novo').addEventListener('click', () => {
      if (confirm('Iniciar uma nova vistoria em branco? Os dados atuais serão apagados.')) {
        estado = V.estadoInicial();
        V.storage.salvar(estado);
        repintarTudo();
      }
    });

    $('#btn-exemplo').addEventListener('click', () => {
      estado = V.sample.carregarExemplo();
      V.storage.salvar(estado);
      repintarTudo();
    });

    $('#btn-exportar').addEventListener('click', exportarJSON);
    $('#file-importar').addEventListener('change', importarJSON);
    $('#btn-imprimir').addEventListener('click', imprimir);

    $$('[data-template]').forEach((btn) => {
      btn.addEventListener('click', () => adicionarAmbiente(btn.getAttribute('data-template')));
    });
  }

  function exportarJSON() {
    const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const nome = (estado.imovel.endereco || 'vistoria')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    a.href = url;
    a.download = `vistoria-${nome || 'imovel'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importarJSON(ev) {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dados = JSON.parse(reader.result);
        if (!dados || typeof dados !== 'object' || !Array.isArray(dados.ambientes)) {
          throw new Error('Estrutura inválida.');
        }
        estado = Object.assign(V.estadoInicial(), dados);
        V.storage.salvar(estado);
        repintarTudo();
      } catch (err) {
        alert('Não foi possível importar este arquivo: ' + err.message);
      }
      ev.target.value = '';
    };
    reader.readAsText(file);
  }

  function imprimir() {
    $('#laudo').innerHTML = V.report.render(estado);
    window.print();
  }

  /* ---------- navegação lateral ---------- */
  function ligarNavegacao() {
    const links = $$('.steps a');
    const secoes = links
      .map((a) => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);
    if (!('IntersectionObserver' in window) || !secoes.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = '#' + entry.target.id;
            links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === id));
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    secoes.forEach((s) => obs.observe(s));
  }

  /* ---------- repintura completa ---------- */
  function repintarTudo() {
    pintarCamposEstaticos();
    renderAmbientes();
    renderInventario();
    renderManutencao();
    renderComparativo();
  }

  /* ---------- init ---------- */
  function init() {
    pintarCamposEstaticos();
    ligarCamposEstaticos();
    renderAmbientes();
    ligarAmbientes();
    renderInventario();
    ligarInventario();
    renderManutencao();
    ligarManutencao();
    renderComparativo();
    ligarComparativo();
    ligarLightbox();
    ligarTopo();
    ligarNavegacao();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
