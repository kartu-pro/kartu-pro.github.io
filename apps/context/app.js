import { apiGet } from '../../js/api.js';
import PosSelect from '../../js/components/PosSelect.js';
import WordFilter from '../../js/components/WordFilter.js';
import ChipMultiSelectFilter from '../../js/components/ChipMultiSelectFilter.js';
import { transliterate, computeDiff } from '../../js/utils.js';
import { PERSON_NUM, QUANTITIES, CASES, SCREEVES, POSTPOSITIONS } from '../../js/constants.js';

const { createApp, ref, computed, nextTick, onMounted, watch } = Vue;

createApp({
  components: {
    'pos-select': PosSelect,
    'word-filter': WordFilter,
    'chip-multi-select-filter': ChipMultiSelectFilter,
  },
  setup() {
    const appState = ref('setup');
    const dictionary = ref([]);
    const activeQueue = ref([]);
    const currentCard = ref(null);
    const isLoadingDictionary = ref(true); // New ref for dictionary loading state

    const wordSearch = ref('');
    const textInput = ref('');
    const isAnswerSubmitted = ref(false);
    const feedback = ref({ msg: '', type: '', diff: null });
    const clozeInput = ref(null);

    const filters = ref({
      topic: 'verb', // Initialize topic to 'verb'
      words: [], tags: [], scr: [], subj: [], includeObjs: false, case: [], qty: [], pp: []
    });

    onMounted(() => {
      // Load dictionary in the background, non-blocking
      apiGet('/words')
        .then(words => {
          dictionary.value = words;
        })
        .catch(err => {
          console.error("Failed to load words", err);
          // Optionally show an error message to the user
        })
        .finally(() => {
          isLoadingDictionary.value = false;
        });

      // Initialize POS-specific filters for the default 'verb' topic
      resetPosFilters('verb');
    });

    watch(() => filters.value.topic, (newTopic, oldTopic) => {
      // Only reset filters if the topic actually changed by user interaction, not initial setup
      if (newTopic !== oldTopic) {
        resetPosFilters(newTopic);
      }
    }, { immediate: false }); // Do not run immediately on component mount, handled by onMounted

    const availableTags = computed(() => {
      const tags = new Set();
      dictionary.value.filter(w => w.pos === filters.value.topic).forEach(w => w.tags.forEach(t => tags.add(t)));
      return Array.from(tags).sort();
    });

    const resetPosFilters = (newTopic) => {
      filters.value.words = [];
      filters.value.tags = [];
      filters.value.scr = [];
      filters.value.subj = [];
      filters.value.includeObjs = false;
      filters.value.case = [];
      filters.value.qty = [];
      filters.value.pp = [];

      if (newTopic === 'verb') {
        filters.value.scr = ['pres', 'fut', 'aor'];
        filters.value.subj = Object.keys(PERSON_NUM);
      } else if (newTopic === 'noun') {
        filters.value.case = Object.keys(CASES);
        filters.value.qty = Object.keys(QUANTITIES);
      } else if (newTopic === 'pron') {
        filters.value.case = ['nom', 'erg', 'dat'];
        filters.value.qty = Object.keys(QUANTITIES);
      } else if (newTopic === 'adj') {
        filters.value.case = Object.keys(CASES);
      }
    };

    const addWordToFilters = (w) => {
      filters.value.words.push(w);
      wordSearch.value = ''; // Clear search input in app.js
    };
    const removeWordFromFilters = (w) => {
      filters.value.words = filters.value.words.filter(x => x.uuid !== w.uuid);
    };

    const validationErrors = computed(() => {
      const errors = [];
      const f = filters.value;

      if (!f.topic) {
        errors.push("Select a Part of Speech");
        return errors;
      }

      if (f.topic === 'verb') {
        if (f.scr.length === 0) errors.push("Select at least one Screeve");
        if (f.subj.length === 0) errors.push("Select at least one Logical Subject");
      } else if (f.topic === 'noun' || f.topic === 'pron') {
        if (f.case.length === 0) errors.push("Select at least one Case");
        if (f.qty.length === 0) errors.push("Select at least one Quantity");
      } else if (f.topic === 'adj') {
        if (f.case.length === 0) errors.push("Select at least one Case");
      }

      return errors;
    });

    const startDrill = async () => {
      appState.value = 'loading';

      /** @type {import('../../01_types.js').ContextRequest} */
      const requestPayload = { pos: filters.value.topic };

      if (filters.value.words.length) {
        requestPayload.uuids = filters.value.words.map(w => w.uuid);
      }
      if (filters.value.tags.length) {
        requestPayload.tags = filters.value.tags;
      }

      // Add POS-specific filters
      if (filters.value.topic === 'verb') {
        if (filters.value.scr.length) requestPayload.screeves = filters.value.scr;
        if (filters.value.subj.length) requestPayload.subjects = filters.value.subj;
      } else if (filters.value.topic === 'noun') {
        if (filters.value.case.length) requestPayload.cases = filters.value.case;
        if (filters.value.qty.length) requestPayload.qtys = filters.value.qty;
        if (filters.value.pp.length) requestPayload.pps = filters.value.pp;
      } else if (filters.value.topic === 'pron' || filters.value.topic === 'adj') {
        if (filters.value.case.length) requestPayload.cases = filters.value.case;
      }

      // Convert arrays in the payload to comma-separated strings for URLSearchParams
      const params = new URLSearchParams();
      for (const key in requestPayload) {
        if (Array.isArray(requestPayload[key])) {
          params.append(key, requestPayload[key].join(','));
        } else {
          params.append(key, requestPayload[key]);
        }
      }

      // Add includeObjs if present, as it might be an additional endpoint parameter
      if (filters.value.includeObjs) {
        params.append('includeObjs', 'true');
      }

      const queryString = params.toString();

      try {
        const rawCards = await apiGet(`/context?${queryString}`);

        activeQueue.value = rawCards.map(c => {
          const targetPos = c.sentence.indexOf(c.target);
          const prefix = targetPos !== -1 ? c.sentence.slice(0, targetPos) : c.sentence;
          const suffix = targetPos !== -1 ? c.sentence.slice(targetPos + c.target.length) : '';

          return {
            prefix,
            suffix,
            ans: c.answer,
            hint: c.hint || '',
            needsReinsert: false
          };
        }).sort(() => 0.5 - Math.random());

        appState.value = 'quiz';
        loadNextCard();
      } catch (e) {
        alert(e.message || "Failed to load cards.");
        appState.value = 'setup';
      }
    };

    const loadNextCard = () => {
      currentCard.value = activeQueue.value[0];
      isAnswerSubmitted.value = false;
      textInput.value = '';
      feedback.value = { msg: '', type: '', diff: null };
      nextTick(() => clozeInput.value?.focus());
    };

    const handleTextInput = (e) => {
      if (isAnswerSubmitted.value) return;
      textInput.value = transliterate(e.target.value);
    };

    const handlePrimaryAction = () => {
      if (!isAnswerSubmitted.value && textInput.value.trim()) {
        const isCorrect = textInput.value.trim() === currentCard.value.ans;
        isAnswerSubmitted.value = true;

        if (isCorrect) {
          feedback.value = { msg: '✅ Correct!', type: 'success', diff: null };
        } else {
          feedback.value = { msg: '❌ Not quite.', type: 'error', diff: computeDiff(textInput.value.trim(), currentCard.value.ans) };
          currentCard.value.needsReinsert = true;
        }
      } else if (isAnswerSubmitted.value) {
        const card = activeQueue.value.shift();

        if (card && card.needsReinsert) {
          card.needsReinsert = false;
          const insertIdx = Math.min(activeQueue.value.length, Math.floor(Math.random() * 5) + 4);
          activeQueue.value.splice(insertIdx, 0, card);
        }

        if (activeQueue.value.length === 0) {
          appState.value = 'finished';
        } else {
          loadNextCard();
        }
      }
    };

    return {
      appState, dictionary, isLoadingDictionary, filters, PERSON_NUM, QUANTITIES, CASES, SCREEVES, POSTPOSITIONS,
      wordSearch, availableTags, validationErrors, startDrill,
      activeQueue, currentCard, textInput, isAnswerSubmitted, feedback, clozeInput,
      handleTextInput, handlePrimaryAction,
      addWordToFilters, removeWordFromFilters
    };
  }
}).mount('#app');
