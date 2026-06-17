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

  global.Vistoria = global.Vistoria || {};
  global.Vistoria.photos = { processar };
})(window);
