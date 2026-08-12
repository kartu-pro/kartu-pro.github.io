import { POS, SCREEVE, PERSON_NUM, CASE, QTY, POSTPOSITION } from '/js/constants.js';
import { createFilterEngine } from '/js/filterEngine.js';

const SCHEMAS = {
  [POS.VERB]: {
    fields: {
      words: { param: 'uuids', isWords: true },
      tags: {},
      scr: { param: 'screeves', default: () => [SCREEVE.PRES, SCREEVE.FUT, SCREEVE.AOR], requiredMsg: 'Select at least one Screeve' },
      subj: { param: 'subjects', default: () => Object.values(PERSON_NUM), requiredMsg: 'Select at least one Subject' },
    }
  },
  [POS.NOUN]: {
    fields: {
      words: { param: 'uuids', isWords: true },
      tags: {},
      case: { param: 'cases', default: () => Object.values(CASE), requiredMsg: 'Select at least one Case' },
      qty: { param: 'qtys', default: () => Object.values(QTY), requiredMsg: 'Select at least one Quantity' },
      pp: { param: 'pps', default: () => [POSTPOSITION.NONE], requiredMsg: "Select at least one Postposition or 'none'" },
    }
  },
  [POS.PRON]: {
    fields: {
      words: { param: 'uuids', isWords: true },
      tags: {},
      case: { param: 'cases', default: () => [CASE.NOM, CASE.ERG, CASE.DAT], requiredMsg: 'Select at least one Case' },
      qty: { param: 'qtys', default: () => Object.values(QTY) },
    }
  },
  [POS.ADJ]: {
    fields: {
      words: { param: 'uuids', isWords: true },
      tags: {},
      case: { param: 'cases', default: () => Object.values(CASE), requiredMsg: 'Select at least one Case' },
    }
  }
};

const engine = createFilterEngine((topic = POS.VERB) => {
  const schema = SCHEMAS[topic] || SCHEMAS[POS.VERB];
  return { topicRequired: true, staticDefaults: { topic }, fields: schema.fields };
});

export const getDefaultFilters = (topic) => engine.getDefaults(topic);
export const validateFilters = (filters) => engine.validate(filters);
export const parseQueryParams = (q, dict) => engine.parse(q, dict);
export const buildQueryString = (filters) => engine.buildQuery(filters);
