// Cálculo de homogeneização de amostras por tratamento por fatores
// (MCDDM — Método Comparativo Direto de Dados de Mercado).

export function fatorOferta(amostraEhOferta, fOferta) {
  return amostraEhOferta ? fOferta : 1.0;
}

// Fator área baseado em relação alométrica: F = (A_amostra / A_aval) ^ n.
export function fatorArea(areaAmostra, areaAval, n) {
  if (!areaAmostra || !areaAval) return 1;
  return Math.pow(areaAmostra / areaAval, n);
}

// Fator idade — depreciação linear simples (em %/ano).
export function fatorIdade(idadeAmostra, idadeAval, depreciacaoAnualPct) {
  const dep = depreciacaoAnualPct / 100;
  const vrAmostra = 1 - idadeAmostra * dep;
  const vrAval = 1 - idadeAval * dep;
  if (vrAmostra <= 0 || vrAval <= 0) return 1;
  return vrAval / vrAmostra;
}

// Fator linear por notas qualitativas: F = 1 + (nota_aval - nota_amostra) * peso.
export function fatorNota(notaAval, notaAmostra, peso) {
  return 1 + (notaAval - notaAmostra) * peso;
}

// Calcula homogeneização para cada amostra. Retorna lista com:
//  - valor unitário bruto
//  - cada fator individual
//  - fator total
//  - valor unitário homogeneizado
export function homogenizarAmostras({ amostras, avaliando, fatores, variavel }) {
  return amostras.map((a, i) => {
    const area = Number(a.area) || 0;
    const preco = Number(a.preco) || 0;
    const vuBruto = area > 0 ? preco / area : 0;

    const fOferta = fatorOferta(!!a.oferta, Number(fatores.oferta) || 1);
    const fArea = fatorArea(area, avaliando.area, Number(fatores.areaN) || 0);
    const fIdade = fatorIdade(
      Number(a.idade) || 0,
      Number(avaliando.idade) || 0,
      Number(fatores.depreciacaoAnual) || 0
    );
    const fLocalizacao = fatorNota(
      Number(avaliando.notaLocalizacao) || 0,
      Number(a.notaLocalizacao) || 0,
      Number(fatores.localizacao) || 0
    );
    const fPadrao = fatorNota(
      Number(avaliando.notaPadrao) || 0,
      Number(a.notaPadrao) || 0,
      Number(fatores.padrao) || 0
    );
    const fConservacao = fatorNota(
      Number(avaliando.notaConservacao) || 0,
      Number(a.notaConservacao) || 0,
      Number(fatores.conservacao) || 0
    );
    const fTransposicao = fatorNota(
      Number(avaliando.notaTransposicao) || 0,
      Number(a.notaTransposicao) || 0,
      Number(fatores.transposicao) || 0
    );

    const fTotal =
      fOferta * fArea * fIdade * fLocalizacao * fPadrao * fConservacao * fTransposicao;

    const vuHom = vuBruto * fTotal;
    return {
      index: i + 1,
      bruto: vuBruto,
      fOferta,
      fArea,
      fIdade,
      fLocalizacao,
      fPadrao,
      fConservacao,
      fTransposicao,
      fTotal,
      vuHom,
      ehOutlier: false,
      original: a,
      variavel
    };
  });
}
