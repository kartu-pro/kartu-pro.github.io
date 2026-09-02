import { SCREEVE, PERSON_NUM } from '/js/constants.js';
import { createFilterEngine } from '/js/filterEngine.js';

const SCHEMA = {
  fields: {
    words: { param: 'uuids', isWords: true, default: () => [] },
    tags: { default: () => [] },
    scr: { param: 'screeves', default: () => [SCREEVE.PRES,SCREEVE.FUT,SCREEVE.AOR], requiredMsg: 'Select at least one Screeve' },
    subj: { param: 'subjects', default: () => Object.values(PERSON_NUM), requiredMsg: 'Select at least one Subject' },
  }
};

const engine = createFilterEngine(() => {
  return { topicRequired: false, staticDefaults: {}, fields: SCHEMA.fields };
});

export const getDefaultFilters = () => engine.getDefaults();
export const validateFilters = (filters) => engine.validate(filters);
export const parseQueryParams = (q, dict) => engine.parse(q, dict);
export const buildQueryString = (filters) => engine.buildQuery(filters);
