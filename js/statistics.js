// Funções estatísticas usadas na avaliação imobiliária (NBR 14653-2).

export function mean(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function stdDev(values, sample = true) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const sumSq = values.reduce((acc, v) => acc + (v - m) ** 2, 0);
  return Math.sqrt(sumSq / (sample ? values.length - 1 : values.length));
}

export function coefVar(values) {
  const m = mean(values);
  if (!m) return 0;
  return stdDev(values) / m;
}

// Critério de Chauvenet: rejeita amostra cuja probabilidade
// (estimada pela Normal padrão) de ocorrência seja menor que 1/(2n).
export function chauvenetOutliers(values) {
  if (values.length < 3) return { kept: [...values], removed: [] };
  const m = mean(values);
  const s = stdDev(values);
  if (!s) return { kept: [...values], removed: [] };
  const n = values.length;
  // Aproximação polinomial para o z crítico de Chauvenet (1/(2n)).
  const dmax = chauvenetCritical(n);
  const kept = [];
  const removed = [];
  values.forEach((v, i) => {
    const z = Math.abs((v - m) / s);
    if (z > dmax) removed.push({ index: i, value: v, z });
    else kept.push(v);
  });
  return { kept, removed, dmax };
}

// Tabela aproximada de Chauvenet — n até ~100. Para n maior usa inversa da
// função erro complementar.
function chauvenetCritical(n) {
  const table = {
    3: 1.38, 4: 1.54, 5: 1.65, 6: 1.73, 7: 1.80, 8: 1.86, 9: 1.92, 10: 1.96,
    12: 2.04, 15: 2.13, 20: 2.24, 25: 2.33, 30: 2.39, 40: 2.49, 50: 2.57, 100: 2.81
  };
  if (table[n]) return table[n];
  // Interpolar
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (n <= keys[0]) return table[keys[0]];
  if (n >= keys[keys.length - 1]) {
    // Aproximação: z tal que erfc(z/sqrt(2)) = 1/n, derivada empírica.
    return Math.sqrt(2 * Math.log(n));
  }
  for (let i = 0; i < keys.length - 1; i++) {
    if (n >= keys[i] && n <= keys[i + 1]) {
      const k1 = keys[i], k2 = keys[i + 1];
      const v1 = table[k1], v2 = table[k2];
      return v1 + ((n - k1) / (k2 - k1)) * (v2 - v1);
    }
  }
  return 2;
}

// Valores críticos t de Student bicaudal para 80% de confiança (α = 0,20).
// Suficiente para amostras pequenas típicas em avaliações.
const T80 = {
  1: 3.078, 2: 1.886, 3: 1.638, 4: 1.533, 5: 1.476, 6: 1.440, 7: 1.415,
  8: 1.397, 9: 1.383, 10: 1.372, 11: 1.363, 12: 1.356, 13: 1.350,
  14: 1.345, 15: 1.341, 16: 1.337, 17: 1.333, 18: 1.330, 19: 1.328,
  20: 1.325, 21: 1.323, 22: 1.321, 23: 1.319, 24: 1.318, 25: 1.316,
  30: 1.310, 40: 1.303, 50: 1.299, 60: 1.296, 80: 1.292, 100: 1.290,
  200: 1.286
};

export function tStudent80(df) {
  if (df <= 0) return 0;
  if (T80[df]) return T80[df];
  const keys = Object.keys(T80).map(Number).sort((a, b) => a - b);
  if (df >= keys[keys.length - 1]) return 1.282; // z para 80%
  for (let i = 0; i < keys.length - 1; i++) {
    if (df >= keys[i] && df <= keys[i + 1]) {
      const k1 = keys[i], k2 = keys[i + 1];
      const v1 = T80[k1], v2 = T80[k2];
      return v1 + ((df - k1) / (k2 - k1)) * (v2 - v1);
    }
  }
  return 1.282;
}

// Intervalo de confiança (80%) da média.
export function confidenceInterval80(values) {
  if (values.length < 2) {
    const m = mean(values);
    return { mean: m, lower: m, upper: m, amplitude: 0, t: 0 };
  }
  const n = values.length;
  const m = mean(values);
  const s = stdDev(values);
  const t = tStudent80(n - 1);
  const halfWidth = t * s / Math.sqrt(n);
  const lower = m - halfWidth;
  const upper = m + halfWidth;
  return {
    mean: m,
    lower,
    upper,
    amplitude: m ? (upper - lower) / m : 0,
    t
  };
}
