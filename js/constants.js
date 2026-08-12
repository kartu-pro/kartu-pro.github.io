// --- PARTS OF SPEECH ---
export const POS = {
  VERB: 'verb',
  NOUN: 'noun',
  PRON: 'pron',
  ADJ: 'adj',
};

export const POS_LABELS = {
  [POS.VERB]: 'Verb',
  [POS.NOUN]: 'Noun',
  [POS.PRON]: 'Pronoun',
  [POS.ADJ]: 'Adjective',
};

// --- SCREEVES ---
export const SCREEVE = {
  PRES: 'pres',
  IMP: 'imp',
  PRES_SUBJ: 'pres-subj',
  FUT: 'fut',
  COND: 'cond',
  FUT_SUBJ: 'fut-subj',
  AOR: 'aor',
  OPT: 'opt',
  PERF: 'perf',
  PLU: 'plu',
  PERF_SUBJ: 'perf-subj',
};

export const SCREEVE_LABELS = {
  [SCREEVE.PRES]: 'Present',
  [SCREEVE.IMP]: 'Imperfect',
  [SCREEVE.PRES_SUBJ]: 'Pres. Subj.',
  [SCREEVE.FUT]: 'Future',
  [SCREEVE.COND]: 'Conditional',
  [SCREEVE.FUT_SUBJ]: 'Fut. Subj.',
  [SCREEVE.AOR]: 'Aorist',
  [SCREEVE.OPT]: 'Optative',
  [SCREEVE.PERF]: 'Perfect',
  [SCREEVE.PLU]: 'Pluperfect',
  [SCREEVE.PERF_SUBJ]: 'Perf. Subj.',
};

// --- PERSON / NUMBER ---
export const PERSON_NUM = {
  S1: '1s',
  S2: '2s',
  S3: '3s',
  P1: '1p',
  P2: '2p',
  P3: '3p',
};

export const PERSON_NUM_LABELS = {
  [PERSON_NUM.S1]: '1st Singular',
  [PERSON_NUM.S2]: '2nd Singular',
  [PERSON_NUM.S3]: '3rd Singular',
  [PERSON_NUM.P1]: '1st Plural',
  [PERSON_NUM.P2]: '2nd Plural',
  [PERSON_NUM.P3]: '3rd Plural',
};

// --- CASES ---
export const CASE = {
  NOM: 'nom',
  DAT: 'dat',
  ERG: 'erg',
  GEN: 'gen',
  INS: 'ins',
  ADV: 'adv',
  VOC: 'voc',
};

export const CASE_LABELS = {
  [CASE.NOM]: 'Nominative',
  [CASE.DAT]: 'Dative/Accusative',
  [CASE.ERG]: 'Ergative',
  [CASE.GEN]: 'Genitive',
  [CASE.INS]: 'Instrumental',
  [CASE.ADV]: 'Adverbial',
  [CASE.VOC]: 'Vocative',
};


// --- QUANTITIES ---
export const QTY = {
  SINGULAR: 's',
  PLURAL: 'p',
};

export const QTY_LABELS = {
  [QTY.SINGULAR]: 'Singular',
  [QTY.PLURAL]: 'Plural',
};


// --- POSTPOSITIONS ---
export const POSTPOSITION = {
  NONE: 'none',
  SHI: '-ში',
  ZE: '-ზე',
  TAN: '-თან',
  KEN: '-კენ',
  DAN: '-დან',
  GAN: '-გან',
  MDE: '-მდე',
  TVIS: '-თვის',
};


export const POSTPOSITION_LABELS = {
  [POSTPOSITION.NONE]: 'none',
  [POSTPOSITION.SHI]: '-ში',
  [POSTPOSITION.ZE]: '-ზე',
  [POSTPOSITION.TAN]: '-თან',
  [POSTPOSITION.KEN]: '-კენ',
  [POSTPOSITION.DAN]: '-დან',
  [POSTPOSITION.GAN]: '-გან',
  [POSTPOSITION.MDE]: '-მდე',
  [POSTPOSITION.TVIS]: '-თვის',
};
