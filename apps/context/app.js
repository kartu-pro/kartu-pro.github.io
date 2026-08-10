import { apiGet } from '../../js/api.js';
import PosSelect from '../../js/components/PosSelect.js';
import WordFilter from '../../js/components/WordFilter.js';
import ChipMultiSelectFilter from '../../js/components/ChipMultiSelectFilter.js';
import { transliterate, computeDiff } from '../../js/utils.js';
import {
  POS, POS_LABELS,
  PERSON_NUM, PERSON_NUM_LABELS,
  QTY, QTY_LABELS,
  CASE, CASE_LABELS,
  SCREEVE, SCREEVE_LABELS,
  POSTPOSITION, POSTPOSITION_LABELS
} from '../../js/constants.js';

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
    const isLoadingDictionary = ref(true);

    const wordSearch = ref('');
    const textInput = ref('');
    const isAnswerSubmitted = ref(false);
    const feedback = ref({ msg: '', type: '', diff: null });
    const clozeInput = ref(null);

    const filters = ref({
      topic: POS.VERB, 
      words: [], tags: [], scr: [], subj: [], case: [], qty: [], pp: []
    });

    const parseAndApplyQueryParams = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.toString() === '') {
        return false; // No query parameters found
      }

      // Set topic first to trigger the watcher and reset POS-specific filters
      const posParam = params.get('pos');
      if (posParam && Object.values(POS).includes(posParam)) {
        filters.value.topic = posParam;
      }

      // Apply other filters, overriding any defaults set by resetPosFilters
      const uuidsParam = params.get('uuids');
      if (uuidsParam) {
        const uuidList = uuidsParam.split(',');
        filters.value.words = dictionary.value.filter(word => uuidList.includes(word.uuid));
      }

      const tagsParam = params.get('tags');
      if (tagsParam) filters.value.tags = tagsParam.split(',');

      // Apply POS-specific filters
      if (filters.value.topic === POS.VERB) {
        const screevesParam = params.get('screeves');
        if (screevesParam) filters.value.scr = screevesParam.split(',');
        const subjectsParam = params.get('subjects');
        if (subjectsParam) filters.value.subj = subjectsParam.split(',');
      } else if (filters.value.topic === POS.NOUN) {
        const casesParam = params.get('cases');
        if (casesParam) filters.value.case = casesParam.split(',');
        const qtysParam = params.get('qtys');
        if (qtysParam) filters.value.qty = qtysParam.split(',');
        const ppsParam = params.get('pps');
        if (ppsParam) filters.value.pp = ppsParam.split(',');
      } else if (filters.value.topic === POS.PRON || filters.value.topic === POS.ADJ) {
        const casesParam = params.get('cases');
        if (casesParam) filters.value.case = casesParam.split(',');
        if (filters.value.topic === POS.PRON) {
          const qtysParam = params.get('qtys');
          if (qtysParam) filters.value.qty = qtysParam.split(',');
        }
      }
      return true; // Query parameters were found and applied
    };

    onMounted(() => {
      resetPosFilters(POS.VERB);
      parseAndApplyQueryParams();
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
      filters.value.case = [];
      filters.value.qty = [];
      filters.value.pp = [];

      if (newTopic === POS.VERB) {
        filters.value.scr = [SCREEVE.PRES, SCREEVE.FUT, SCREEVE.AOR];
        filters.value.subj = Object.values(PERSON_NUM);
      } else if (newTopic === POS.NOUN) {
        filters.value.case = Object.values(CASE);
        filters.value.qty = Object.values(QTY);
        filters.value.pp = [POSTPOSITION.NONE];
      } else if (newTopic === POS.PRON) {
        filters.value.case = [CASE.NOM, CASE.ERG, CASE.DAT];
        filters.value.qty = Object.values(QTY);
      } else if (newTopic === POS.ADJ) {
        filters.value.case = Object.values(CASE);
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

      if (f.topic === POS.VERB) {
        if (f.scr.length === 0) errors.push("Select at least one Screeve");
        if (f.subj.length === 0) errors.push("Select at least one Logical Subject");
      } else if (f.topic === POS.NOUN || f.topic === POS.PRON) {
        if (f.case.length === 0) errors.push("Select at least one Case");
        if (f.qty.length === 0) errors.push("Select at least one Quantity");
      } else if (f.topic === POS.ADJ) {
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
      if (filters.value.topic === POS.VERB) {
        if (filters.value.scr.length) requestPayload.screeves = filters.value.scr;
        if (filters.value.subj.length) requestPayload.subjects = filters.value.subj;
      } else if (filters.value.topic === POS.NOUN) {
        if (filters.value.case.length) requestPayload.cases = filters.value.case;
        if (filters.value.qty.length) requestPayload.qtys = filters.value.qty;
        if (filters.value.pp.length) requestPayload.pps = filters.value.pp;
      } else if (filters.value.topic === POS.PRON || filters.value.topic === POS.ADJ) {
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

      const queryString = params.toString();

      // Update URL without reloading the page
      history.pushState({}, '', `?${queryString}`);

      try {
        const rawCards = await apiGet(`/context?${queryString}`);

        activeQueue.value = rawCards.map(c => {
          const targetPos = c.sentence.indexOf(c.target);
          const prefix = targetPos !== -1 ? c.sentence.slice(0, targetPos) : c.sentence;
          const suffix = targetPos !== -1 ? c.sentence.slice(targetPos + c.target.length) : '';

          return {
            prefix,
            suffix,
            answer: c.answer,
            needsReinsert: false
          };
        }).sort(() => 0.5 - Math.random());

        appState.value = 'quiz';
        loadNextCard();
      } catch (e) {
        console.log(e.message || "Failed to load cards.");
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

      const input = e.target;
      const cursorStart = input.selectionStart;
      const lengthBefore = input.value.length;

      // Transliterate text
      const transformed = transliterate(input.value);
      textInput.value = transformed;

      // Preserve caret position after Vue updates DOM
      nextTick(() => {
        // Calculate new position accounting for length differences (e.g., 'sh' -> 'შ')
        const lengthDiff = transformed.length - lengthBefore;
        const newPos = Math.max(0, cursorStart + lengthDiff);
        input.setSelectionRange(newPos, newPos);
      });
    };

    const handlePrimaryAction = () => {
      if (!isAnswerSubmitted.value && textInput.value.trim()) {
        const isCorrect = textInput.value.trim() === currentCard.value.answer;
        isAnswerSubmitted.value = true;

        if (isCorrect) {
          feedback.value = { msg: '✅ Correct!', type: 'success', diff: null };
        } else {
          feedback.value = { msg: '❌ Not quite.', type: 'error', diff: computeDiff(textInput.value.trim(), currentCard.value.answer) };
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
      appState, dictionary, isLoadingDictionary, filters, 
      wordSearch, availableTags, validationErrors, startDrill,
      activeQueue, currentCard, textInput, isAnswerSubmitted, feedback, clozeInput,
      handleTextInput, handlePrimaryAction,
      addWordToFilters, removeWordFromFilters,
      POS, POS_LABELS,
      PERSON_NUM, PERSON_NUM_LABELS,
      QTY, QTY_LABELS,
      CASE, CASE_LABELS,
      SCREEVE, SCREEVE_LABELS,
      POSTPOSITION, POSTPOSITION_LABELS,
    };
  }
}).mount('#app');
