// --- Internal URL Helpers ---
function getCsvParam(params, key) {
  const val = params.get(key);
  return val ? val.split(',').filter(Boolean) : [];
}

function buildQueryStringFromObj(obj) {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(obj)) {
    if (Array.isArray(val) && val.length) {
      params.append(key, val.join(','));
    } else if (val !== undefined && val !== null && val !== '') {
      params.append(key, val);
    }
  }
  return params.toString();
}

// --- Generic Filter Engine ---
export function createFilterEngine(getSchema) {
  return {
    getDefaults(topic) {
      const config = typeof getSchema === 'function' ? getSchema(topic) : getSchema;
      const defaults = { ...config.staticDefaults };

      for (const [key, field] of Object.entries(config.fields)) {
        defaults[key] = typeof field.default === 'function' ? field.default() : (field.default ?? []);
      }
      return defaults;
    },

    validate(filters) {
      const config = typeof getSchema === 'function' ? getSchema(filters?.topic) : getSchema;
      if (!config) return [];

      const errors = [];
      if (config.topicRequired && !filters?.topic) return ['Select a Part of Speech'];

      for (const [key, field] of Object.entries(config.fields)) {
        if (field.requiredMsg && (!filters[key] || !filters[key].length)) {
          errors.push(field.requiredMsg);
        }
      }
      return errors;
    },

    parse(queryString, dictionary = [], defaultTopic) {
      const params = new URLSearchParams(queryString);
      if (!params.toString()) return null;

      const topic = params.get('pos') || defaultTopic;
      const config = typeof getSchema === 'function' ? getSchema(topic) : getSchema;
      const state = this.getDefaults(topic);

      for (const [key, field] of Object.entries(config.fields)) {
        const paramName = field.param || key;
        const vals = getCsvParam(params, paramName);
        if (vals.length) {
          state[key] = field.isWords 
            ? dictionary.filter(w => vals.includes(w.uuid)) 
            : vals;
        }
      }
      return state;
    },

    buildQuery(filters) {
      const config = typeof getSchema === 'function' ? getSchema(filters?.topic) : getSchema;
      const payload = {};

      if (filters?.topic) payload.pos = filters.topic;

      for (const [key, field] of Object.entries(config.fields)) {
        const paramName = field.param || key;
        if (field.isWords && filters[key]?.length) {
          payload[paramName] = filters[key].map(w => w.uuid);
        } else if (filters[key]?.length) {
          payload[paramName] = filters[key];
        }
      }

      return buildQueryStringFromObj(payload);
    }
  };
}