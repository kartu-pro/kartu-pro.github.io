import { SCREEVE, PERSON_NUM } from '../constants.js';
import { createFilterEngine } from '../shared/filterEngine.js';

const engine = createFilterEngine({
  fields: {
    words: { param: 'uuids', isWords: true },
    tags: {},
    screeves: { default: () => [SCREEVE.PRES, SCREEVE.FUT, SCREEVE.AOR], requiredMsg: 'Select at least one Screeve' },
    subjects: { default: () => Object.values(PERSON_NUM), requiredMsg: 'Select at least one Subject' },
  }
});

export const getDefaultFilters = () => engine.getDefaults();
export const validateFilters = (filters) => engine.validate(filters);
export const parseQueryParams = (q, dict) => engine.parse(q, dict);
export const buildQueryString = (filters) => engine.buildQuery(filters);