import { apiGet } from '/js/api.js';
import AppHeader from '/js/components/AppHeader.js';
import FlagContent from '/js/components/FlagContent.js';
import SettingsModal from '/js/components/SettingsModal.js';
import FinishedScreen from '/js/components/FinishedScreen.js';

import SetupScreen from './SetupScreen.js';
import QuizScreen from './QuizScreen.js';

import { useQuiz } from '/js/composables/useQuiz.js';
import { useDictionary } from '/js/composables/useDictionary.js';

import {
  getDefaultFilters,
  parseQueryParams,
  buildQueryString
} from './filters.js';

import { POS } from '/js/constants.js';

const { createApp, ref, onMounted, watch } = Vue;

const GAME_MODES = [
  { value: 'mistake', label: 'Find the Mistake' },
  { value: 'choose', label: 'Choose the Form' },
  { value: 'type', label: 'Type the Form' },
];

createApp({
  components: {
    'app-header': AppHeader,
    'flag-content': FlagContent,
    'settings-modal': SettingsModal,
    'setup-screen': SetupScreen,
    'quiz-screen': QuizScreen,
    'finished-screen': FinishedScreen,
  },
  setup() {
    // 1. Use the composable for words state
    const { dictionary, isLoadingDictionary, loadDictionary } = useDictionary();

    const gameMode = ref('mistake');
    const showSettingsModal = ref(false);
    const showFlagModal = ref(false);

    const filters = ref(getDefaultFilters(POS.VERB));

    const fetchContextCards = async (filterData) => {
      const queryString = buildQueryString(filterData);
      history.pushState({}, '', `?${queryString}`);

      const rawCards = await apiGet(`/context?${queryString}`);
      return rawCards.map(c => ({
        sentence: c.sentence,
        answer: c.answer,
        hint: c.hint,
        target: c.target,
        distractors: c.distractors || [],
        needsReinsert: false
      }));
    };

    const {
      appState,
      activeQueue,
      currentCard,
      isAnswerSubmitted,
      feedback,
      startDrill,
      handleAnswerSubmitted,
      advanceCard
    } = useQuiz(fetchContextCards);

    const handleStart = () => startDrill(filters.value);

    const resetPosFilters = (newTopic) => {
      filters.value = getDefaultFilters(newTopic);
    };

    onMounted(() => {
      resetPosFilters(POS.VERB);

      // Parse URL params immediately using whatever dictionary is currently cached
      const parsed = parseQueryParams(window.location.search, dictionary.value);
      if (parsed) filters.value = parsed;

      // 2. Load dictionary asynchronously and re-parse URL params once dictionary resolves
      loadDictionary().then(words => {
        const reParsed = parseQueryParams(window.location.search, words);
        if (reParsed) filters.value = reParsed;
      });
    });

    watch(() => filters.value.topic, (newTopic, oldTopic) => {
      if (newTopic !== oldTopic) resetPosFilters(newTopic);
    });

    return {
      appState, dictionary, isLoadingDictionary, filters, handleStart,
      activeQueue, currentCard, isAnswerSubmitted, feedback, advanceCard,
      gameMode, showSettingsModal, showFlagModal, CONTEXT_GAME_MODES: GAME_MODES,
      handleAnswerSubmitted
    };
  }
}).mount('#app');
