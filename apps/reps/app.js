import { apiGet } from '/js/api.js';
import AppHeader from '/js/components/AppHeader.js';
import FlagContent from '/js/components/FlagContent.js';
import SettingsModal from '/js/components/SettingsModal.js';
import FinishedScreen from '/js/components/FinishedScreen.js';

import SetupScreen from './SetupScreen.js';
import QuizScreen from './QuizScreen.js';

import { useQuiz } from '/js/composables/useQuiz.js';
import { useDictionary } from '/js/composables/useDictionary.js';

import { getDefaultFilters, parseQueryParams, buildQueryString } from './filters.js';

const { createApp, ref, onMounted, watch } = Vue;

const GAME_MODES = [
  { value: 'choose_translation', label: 'Choose English Translation' },
  { value: 'choose_form', label: 'Choose Georgian Form' },
  { value: 'type', label: 'Type Georgian Form' },
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
    const { dictionary, isLoadingDictionary, loadDictionary } = useDictionary();

    const gameMode = ref('choose_translation');
    const showSettingsModal = ref(false);
    const showFlagModal = ref(false);

    const filters = ref(getDefaultFilters());

    const applyCardMode = (card, mode) => {
      const isTranslation = mode === 'choose_translation';
      const raw = card._raw;

      card.sentence = isTranslation ? raw.answer.ka : raw.answer.en;
      card.answer = isTranslation ? raw.answer.en : raw.answer.ka;
      card.distractors = (raw.distractors || []).map(d => isTranslation ? d.en : d.ka);
      card.hint = `${raw.screeve} · ${raw.subject}`;
    };

    const fetchRepCards = async (filterData) => {
      const queryString = buildQueryString(filterData);
      history.pushState({}, '', `?${queryString}`);

      const rawCards = await apiGet(`/reps?${queryString}`);

      return rawCards.map(c => {
        const card = { _raw: c, needsReinsert: false };
        applyCardMode(card, gameMode.value);
        return card;
      });
    };

    watch(gameMode, (newMode) => {
      activeQueue.value.forEach(card => {
        if (card._raw) {
          applyCardMode(card, newMode);
        }
      });
    });

    const {
      appState,
      activeQueue,
      currentCard,
      isAnswerSubmitted,
      feedback,
      startDrill,
      handleAnswerSubmitted,
      advanceCard
    } = useQuiz(fetchRepCards);

    const handleStart = () => startDrill(filters.value);

    onMounted(() => {
      const parsed = parseQueryParams(window.location.search, dictionary.value);
      if (parsed) filters.value = parsed;

      loadDictionary().then(words => {
        const reParsed = parseQueryParams(window.location.search, words);
        if (reParsed) filters.value = reParsed;
      });
    });

    return {
      appState, dictionary, isLoadingDictionary, filters, handleStart,
      activeQueue, currentCard, isAnswerSubmitted, feedback, advanceCard,
      gameMode, showSettingsModal, showFlagModal, GAME_MODES,
      handleAnswerSubmitted
    };
  }
}).mount('#app');
