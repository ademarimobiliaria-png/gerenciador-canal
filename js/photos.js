/* photos.js — leitura e compressão de fotos para armazenamento local. */
(function (global) {
  'use strict';

  const MAX_LADO = 1280; // px — maior dimensão após o redimensionamento
  const QUALIDADE = 0.72; // qualidade JPEG

  /**
   * Lê um File de imagem, redimensiona e devolve um data URL JPEG.
   * Mantém as fotos pequenas o suficiente para caberem no localStorage.
   * @param {File} file
   * @returns {Promise<string>} data URL
   */
  function processar(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type || file.type.indexOf('image/') !== 0) {
        reject(new Error('Arquivo não é uma imagem.'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('Falha ao ler o arquivo.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Falha ao decodificar a imagem.'));
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > MAX_LADO) {
            height = Math.round((height * MAX_LADO) / width);
            width = MAX_LADO;
          } else if (height >= width && height > MAX_LADO) {
            width = Math.round((width * MAX_LADO) / height);
            height = MAX_LADO;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          try {
            resolve(canvas.toDataURL('image/jpeg', QUALIDADE));
          } catch (err) {
            reject(err);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Analisa a qualidade técnica de uma foto (heurística, no próprio navegador).
   * Critérios inspirados na skill analise-fotos-vistoria: iluminação,
   * exposição, nitidez e resolução. Devolve uma lista de avisos curtos.
   * É apenas um alerta — a decisão de refazer é do vistoriador.
   * @param {string} dataUrl foto já processada
   * @returns {Promise<string[]>}
   */
  function analisar(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onerror = () => resolve([]);
      img.onload = () => {
        const avisos = [];
        const menor = Math.min(img.width, img.height);
        if (menor < 600) avisos.push('Resolução baixa — refaça em resolução máxima.');

        const escala = 320 / Math.max(img.width, img.height);
        const w = Math.max(8, Math.round(img.width * escala));
        const h = Math.max(8, Math.round(img.height * escala));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        let dados;
        try {
          dados = ctx.getImageData(0, 0, w, h).data;
        } catch (e) {
          resolve(avisos);
          return;
        }

        const cinza = new Float32Array(w * h);
        let soma = 0;
        let estourado = 0;
        let escuro = 0;
        for (let i = 0, p = 0; i < dados.length; i += 4, p++) {
          const y = 0.299 * dados[i] + 0.587 * dados[i + 1] + 0.114 * dados[i + 2];
          cinza[p] = y;
          soma += y;
          if (y > 250) estourado++;
          if (y < 8) escuro++;
        }
        const total = w * h;
        const media = soma / total;
        if (media < 60) avisos.push('Foto escura — acenda as luzes ou use luz lateral (lanterna).');
        else if (media > 205) avisos.push('Foto clara demais — reduza a exposição.');
        if (estourado / total > 0.15) avisos.push('Áreas estouradas (contraluz/flash) — mude o ângulo.');
        if (escuro / total > 0.35 && media >= 60) avisos.push('Grandes áreas muito escuras — detalhes podem se perder.');

        // Nitidez: variância do laplaciano (valor baixo = pouca borda/desfoque).
        let n = 0;
        let s1 = 0;
        let s2 = 0;
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            const lap = 4 * cinza[i] - cinza[i - 1] - cinza[i + 1] - cinza[i - w] - cinza[i + w];
            s1 += lap;
            s2 += lap * lap;
            n++;
          }
        }
        const variancia = s2 / n - (s1 / n) * (s1 / n);
        if (variancia < 120) avisos.push('Possível desfoque/tremido (ou superfície muito lisa) — confira e refaça se necessário.');
        resolve(avisos);
      };
      img.src = dataUrl;
    });
  }

  /** Processa a foto e devolve { src, avisos }. */
  function processarComAnalise(file) {
    return processar(file).then((src) => analisar(src).then((avisos) => ({ src, avisos })));
  }

  global.Vistoria = global.Vistoria || {};
  global.Vistoria.photos = { processar, analisar, processarComAnalise };
})(window);
