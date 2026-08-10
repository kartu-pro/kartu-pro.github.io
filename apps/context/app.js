import { apiGet } from '../../js/api.js';
import PosSelect from '../../js/components/PosSelect.js';
import WordFilter from '../../js/components/WordFilter.js';
import ChipMultiSelectFilter from '../../js/components/ChipMultiSelectFilter.js';

const CONFIG = {
  personNum: ['1s', '2s', '3s', '1p', '2p', '3p'],
  qty: { 's': 'Singular', 'p': 'Plural' },
  cases: { 'nom': 'Nom', 'dat': 'Dat/Acc', 'erg': 'Erg', 'gen': 'Gen', 'ins': 'Ins', 'adv': 'Adv', 'voc': 'Voc' },
  scr: { 'pres': 'Present', 'imp': 'Imperfect', 'pres-subj': 'Pres. Subj.', 'fut': 'Future', 'cond': 'Conditional', 'fut-subj': 'Fut. Subj.', 'aor': 'Aorist', 'opt': 'Optative', 'perf': 'Perfect', 'pluperf': 'Pluperfect', 'perf-subj': 'Perf. Subj.' },
  pp: ['-თან', '-გან', '-თვის', '-ზე', '-კენ', '-ში']
};

const enToKaMap = { 'a': 'ა', 'b': 'ბ', 'c': 'ც', 'C': 'ჩ', 'd': 'დ', 'D': 'ძ', 'e': 'ე', 'f': 'ფ', 'g': 'გ', 'h': 'ჰ', 'i': 'ი', 'j': 'ჯ', 'k': 'კ', 'l': 'ლ', 'm': 'მ', 'n': 'ნ', 'o': 'ო', 'p': 'პ', 'q': 'ქ', 'r': 'რ', 'R': 'ღ', 's': 'ს', 'S': 'შ', 't': 'ტ', 'T': 'თ', 'u': 'უ', 'v': 'ვ', 'w': 'წ', 'W': 'ჭ', 'x': 'ხ', 'y': 'ყ', 'z': 'ზ', 'Z': 'ჟ' };

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

    const wordSearch = ref('');
    const textInput = ref('');
    const isAnswerSubmitted = ref(false);
    const feedback = ref({ msg: '', type: '', diff: null });
    const clozeInput = ref(null);

    const filters = ref({
      topic: '', words: [], tags: [], scr: [], subj: [], includeObjs: false, case: [], qty: [], pp: []
    });

    onMounted(async () => {
      appState.value = 'loading';
      try {
        const words = await apiGet('/words');
        dictionary.value = words;
      } catch (err) {
        console.error("Failed to load words", err);
      } finally {
        appState.value = 'setup';
      }
    });

    watch(() => filters.value.topic, (newTopic, oldTopic) => {
      if (newTopic !== oldTopic) {
        resetPosFilters(newTopic);
      }
    });

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
        filters.value.subj = [...CONFIG.personNum];
      } else if (newTopic === 'noun') {
        filters.value.case = Object.keys(CONFIG.cases);
        filters.value.qty = Object.keys(CONFIG.qty);
      } else if (newTopic === 'pron') {
        filters.value.case = ['nom', 'erg', 'dat'];
        filters.value.qty = Object.keys(CONFIG.qty);
      } else if (newTopic === 'adj') {
        filters.value.case = Object.keys(CONFIG.cases);
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
      let converted = '';
      for (let char of e.target.value) converted += enToKaMap[char] || char;
      textInput.value = converted;
    };

    const getDiff = (input, expected) => {
      const n = input.length, m = expected.length;
      const dp = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          if (input[i - 1] === expected[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
          else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
      let i = n, j = m, result = [];
      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && input[i - 1] === expected[j - 1]) { result.unshift({ char: input[i - 1], type: 'match' }); i--; j--; }
        else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) { result.unshift({ char: expected[j - 1], type: 'insertion' }); j--; }
        else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) { result.unshift({ char: input[i - 1], type: 'deletion' }); i--; }
      }
      return result;
    };

    const handlePrimaryAction = () => {
      if (!isAnswerSubmitted.value && textInput.value.trim()) {
        const isCorrect = textInput.value.trim() === currentCard.value.ans;
        isAnswerSubmitted.value = true;

        if (isCorrect) {
          feedback.value = { msg: '✅ Correct!', type: 'success', diff: null };
        } else {
          feedback.value = { msg: '❌ Not quite.', type: 'error', diff: getDiff(textInput.value.trim(), currentCard.value.ans) };
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
      appState, dictionary, CONFIG, filters, wordSearch, availableTags,
      validationErrors, startDrill,
      activeQueue, currentCard, textInput, isAnswerSubmitted, feedback, clozeInput,
      handleTextInput, handlePrimaryAction,
      addWordToFilters, removeWordFromFilters
    };
  }
}).mount('#app');
