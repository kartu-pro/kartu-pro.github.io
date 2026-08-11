import { 
  POS, SCREEVE, PERSON_NUM, CASE, QTY, POSTPOSITION 
} from './constants.js';

/**
 * Returns default filter values for a given Part of Speech.
 */
export function getDefaultFilters(topic = POS.VERB) {
  const filters = {
    topic,
    words: [],
    tags: [],
    scr: [],
    subj: [],
    case: [],
    qty: [],
    pp: []
  };

  if (topic === POS.VERB) {
    filters.scr = [SCREEVE.PRES, SCREEVE.FUT, SCREEVE.AOR];
    filters.subj = Object.values(PERSON_NUM);
  } else if (topic === POS.NOUN) {
    filters.case = Object.values(CASE);
    filters.qty = Object.values(QTY);
    filters.pp = [POSTPOSITION.NONE];
  } else if (topic === POS.PRON) {
    filters.case = [CASE.NOM, CASE.ERG, CASE.DAT];
    filters.qty = Object.values(QTY);
  } else if (topic === POS.ADJ) {
    filters.case = Object.values(CASE);
  }

  return filters;
}

/**
 * Validates the current filter state and returns error messages.
 */
export function validateFilters(filters) {
  const errors = [];
  if (!filters || !filters.topic) {
    errors.push("Select a Part of Speech");
    return errors;
  }

  if (filters.topic === POS.VERB) {
    if (!filters.scr?.length) errors.push("Select at least one Screeve");
    if (!filters.subj?.length) errors.push("Select at least one Subject");
  } else if (filters.topic === POS.NOUN) {
    if (!filters.case?.length) errors.push("Select at least one Case");
    if (!filters.qty?.length) errors.push("Select at least one Quantity");
    if (!filters.pp?.length) errors.push("Select at least one Postposition or 'none'");
  } else if (filters.topic === POS.PRON) {
    if (!filters.case?.length) errors.push("Select at least one Case");
  } else if (filters.topic === POS.ADJ) {
    if (!filters.case?.length) errors.push("Select at least one Case");
  }

  return errors;
}

/**
 * Parses URL search params string into a filter object.
 */
export function parseQueryParams(queryString, dictionary = []) {
  const params = new URLSearchParams(queryString);
  if (!params.toString()) return null;

  const posParam = params.get('pos');
  const topic = Object.values(POS).includes(posParam) ? posParam : POS.VERB;

  // Start with topic defaults
  const parsed = getDefaultFilters(topic);

  const uuidsParam = params.get('uuids');
  if (uuidsParam) {
    const uuidList = uuidsParam.split(',');
    parsed.words = dictionary.filter(w => uuidList.includes(w.uuid));
  }

  const tagsParam = params.get('tags');
  if (tagsParam) parsed.tags = tagsParam.split(',');

  if (topic === POS.VERB) {
    const screeves = params.get('screeves');
    if (screeves) parsed.scr = screeves.split(',');
    const subjects = params.get('subjects');
    if (subjects) parsed.subj = subjects.split(',');
  } else if (topic === POS.NOUN) {
    const cases = params.get('cases');
    if (cases) parsed.case = cases.split(',');
    const qtys = params.get('qtys');
    if (qtys) parsed.qty = qtys.split(',');
    const pps = params.get('pps');
    if (pps) parsed.pp = pps.split(',');
  } else if (topic === POS.PRON || topic === POS.ADJ) {
    const cases = params.get('cases');
    if (cases) parsed.case = cases.split(',');
    if (topic === POS.PRON) {
      const qtys = params.get('qtys');
      if (qtys) parsed.qty = qtys.split(',');
    }
  }

  return parsed;
}

/**
 * Serializes filters state object into a URL Query String.
 */
export function buildQueryString(filters) {
  const payload = { pos: filters.topic };

  if (filters.words.length) payload.uuids = filters.words.map(w => w.uuid);
  if (filters.tags.length) payload.tags = filters.tags;

  if (filters.topic === POS.VERB) {
    if (filters.scr.length) payload.screeves = filters.scr;
    if (filters.subj.length) payload.subjects = filters.subj;
  } else if (filters.topic === POS.NOUN) {
    if (filters.case.length) payload.cases = filters.case;
    if (filters.qty.length) payload.qty = filters.qty;
    if (filters.pp.length) payload.pps = filters.pp;
  } else if (filters.topic === POS.PRON || filters.topic === POS.ADJ) {
    if (filters.case.length) payload.cases = filters.case;
  }

  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(payload)) {
    params.append(key, Array.isArray(val) ? val.join(',') : val);
  }

  return params.toString();
}
