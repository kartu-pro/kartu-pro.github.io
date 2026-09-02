// useDictionary.js
const { ref } = Vue;
import { apiGet } from '/js/api.js';

const dictionary = ref([]);
const isLoadingDictionary = ref(true);
let fetchPromise = null;

export function useDictionary() {
  const loadDictionary = () => {
    // 1. Instant return if dictionary is already loaded
    if (dictionary.value.length > 0) {
      return Promise.resolve(dictionary.value);
    }

    // 2. Reuse fetch promise if request is already in flight
    if (!fetchPromise) {
      fetchPromise = apiGet('/words')
        .then(words => {
          dictionary.value = words;
          return words; // <--- Explicitly return words so caller receives data
        })
        .catch(err => {
          console.error('Failed to load words', err);
          fetchPromise = null; // Clear cache on error to allow retries
          return [];
        })
        .finally(() => {
          isLoadingDictionary.value = false;
        });
    }
    return fetchPromise;
  };

  return { dictionary, isLoadingDictionary, loadDictionary };
}
