// Critérios de enquadramento da NBR 14653-2 para tratamento por fatores
// e classificação do grau de precisão.

// Tabela simplificada para tratamento por fatores (NBR 14653-2):
//  - Item 2: nº mínimo de dados de mercado efetivamente utilizados.
//  - Item 4: amplitude do intervalo de confiança de 80% em torno da média.
//  - Os outros itens (caracterização, identificação dos dados e
//    apresentação dos cálculos) este app sempre considera atendidos
//    no Grau III, pois oferece formulário completo.
const REQ_TRAT_FATORES = {
  III: { dadosMin: 12, amplitudeMax: 0.30 },
  II:  { dadosMin: 5,  amplitudeMax: 0.40 },
  I:   { dadosMin: 3,  amplitudeMax: 0.50 }
};

// Grau de precisão da estimativa de valor (NBR 14653-2 / Tabela)
const REQ_PRECISAO = {
  III: 0.30,
  II:  0.40,
  I:   0.50
};

export function grauFundamentacao({ nEfetivo, amplitude }) {
  if (nEfetivo >= REQ_TRAT_FATORES.III.dadosMin && amplitude <= REQ_TRAT_FATORES.III.amplitudeMax)
    return { grau: 'III', motivo: `n=${nEfetivo} ≥ 12 e amplitude IC ≤ 30%` };
  if (nEfetivo >= REQ_TRAT_FATORES.II.dadosMin && amplitude <= REQ_TRAT_FATORES.II.amplitudeMax)
    return { grau: 'II', motivo: `n=${nEfetivo} ≥ 5 e amplitude IC ≤ 40%` };
  if (nEfetivo >= REQ_TRAT_FATORES.I.dadosMin && amplitude <= REQ_TRAT_FATORES.I.amplitudeMax)
    return { grau: 'I', motivo: `n=${nEfetivo} ≥ 3 e amplitude IC ≤ 50%` };
  return { grau: 'Não enquadrado', motivo: 'Amostra insuficiente ou amplitude do IC superior a 50%.' };
}

export function grauPrecisao(amplitude) {
  if (amplitude <= REQ_PRECISAO.III) return { grau: 'III', motivo: 'Amplitude IC ≤ 30%' };
  if (amplitude <= REQ_PRECISAO.II)  return { grau: 'II',  motivo: 'Amplitude IC ≤ 40%' };
  if (amplitude <= REQ_PRECISAO.I)   return { grau: 'I',   motivo: 'Amplitude IC ≤ 50%' };
  return { grau: 'Não enquadrado', motivo: 'Amplitude do IC superior a 50%.' };
}
