const { ref } = Vue;
import { apiGet } from '/js/api.js';

const dictionary = ref([]);
const isLoadingDictionary = ref(true);
let fetchPromise = null;

export function useDictionary() {
  const loadDictionary = () => {
    if (!fetchPromise) {
      fetchPromise = apiGet('/words')
        .then(words => { dictionary.value = words; })
        .catch(err => console.error('Failed to load words', err))
        .finally(() => { isLoadingDictionary.value = false; });
    }
    return fetchPromise;
  };

  return { dictionary, isLoadingDictionary, loadDictionary };
}