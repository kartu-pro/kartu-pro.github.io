import { apiGet } from '../../js/api.js';
import AppHeader from '../../js/components/AppHeader.js';
import FlagContent from '../../js/components/FlagContent.js';
import SettingsModal from '../../js/components/SettingsModal.js';
import PosSelect from '../../js/components/PosSelect.js';
import WordFilter from '../../js/components/WordFilter.js';
import ChipMultiSelectFilter from '../../js/components/ChipMultiSelectFilter.js';
import QuizFeedback from '../../js/components/QuizFeedback.js';
import QuizTypeForm from '../../js/components/QuizTypeForm.js';
import QuizChooseForm from '../../js/components/QuizChooseForm.js';
import QuizFindMistake from '../../js/components/QuizFindMistake.js';
import FinishedScreen from '../../js/components/FinishedScreen.js';

import {
  getDefaultFilters,
  validateFilters,
  parseQueryParams,
  buildQueryString
} from '../../js/filterUtils.js';

import { shuffleArray, advanceQueue } from '../../js/queueUtils.js';

import {
  POS, POS_LABELS,
  PERSON_NUM, PERSON_NUM_LABELS,
  QTY, QTY_LABELS,
  CASE, CASE_LABELS,
  SCREEVE, SCREEVE_LABELS,
  POSTPOSITION, POSTPOSITION_LABELS
} from '../../js/constants.js';

const { createApp, ref, computed, onMounted, watch } = Vue;

const CONTEXT_GAME_MODES = [
  { value: 'type', label: 'Type the Form' },
  { value: 'choose', label: 'Choose the Form' },
  { value: 'mistake', label: 'Find the Mistake' }
];

createApp({
  components: {
    'app-header': AppHeader,
    'flag-content': FlagContent,
    'settings-modal': SettingsModal,
    'pos-select': PosSelect,
    'word-filter': WordFilter,
    'chip-multi-select-filter': ChipMultiSelectFilter,
    'quiz-feedback': QuizFeedback,
    'quiz-type-form': QuizTypeForm,
    'quiz-choose-form': QuizChooseForm,
    'quiz-find-mistake': QuizFindMistake,
    'finished-screen': FinishedScreen,
  },
  setup() {
    const appState = ref('setup');
    const dictionary = ref([]);
    const activeQueue = ref([]);
    const currentCard = ref(null);
    const isLoadingDictionary = ref(true);

    const gameMode = ref('type');
    const showSettingsModal = ref(false);
    const showFlagModal = ref(false);
    const typeFormRef = ref(null);

    const wordSearch = ref('');
    const isAnswerSubmitted = ref(false);
    const feedback = ref({ msg: '', type: '', diff: null });

    const filters = ref(getDefaultFilters(POS.VERB));

    const resetPosFilters = (newTopic) => {
      filters.value = getDefaultFilters(newTopic);
    };

    const validationErrors = computed(() => validateFilters(filters.value));

    const availableTags = computed(() => {
      const tags = new Set();
      dictionary.value
        .filter(w => w.pos === filters.value.topic)
        .forEach(w => w.tags?.forEach(t => tags.add(t)));
      return Array.from(tags).sort();
    });

    const currentSentenceParts = computed(() => {
      if (!currentCard.value) return { prefix: '', suffix: '' };
      const targetWord = currentCard.value.target || currentCard.value.answer;
      const targetPos = currentCard.value.sentence.indexOf(targetWord);
      
      if (targetPos === -1) return { prefix: currentCard.value.sentence, suffix: '' };
      
      return {
        prefix: currentCard.value.sentence.slice(0, targetPos),
        suffix: currentCard.value.sentence.slice(targetPos + targetWord.length)
      };
    });

    onMounted(() => {
      resetPosFilters(POS.VERB);
      const parsed = parseQueryParams(window.location.search, dictionary.value);
      if (parsed) filters.value = parsed; // immediately try to set inputs from url

      apiGet('/words')
        .then(words => { 
          dictionary.value = words;
          const parsed = parseQueryParams(window.location.search, dictionary.value);
          if (parsed) filters.value = parsed; // try to set inputs again now that dictionary is loaded
         })
        .catch(err => console.error("Failed to load words", err))
        .finally(() => { isLoadingDictionary.value = false; });
    });

    watch(() => filters.value.topic, (newTopic, oldTopic) => {
      if (newTopic !== oldTopic) resetPosFilters(newTopic);
    });

    const addWordToFilters = (w) => {
      filters.value.words.push(w);
      wordSearch.value = '';
    };

    const removeWordFromFilters = (w) => {
      filters.value.words = filters.value.words.filter(x => x.uuid !== w.uuid);
    };

    const startDrill = async () => {
      appState.value = 'loading';
      const queryString = buildQueryString(filters.value);
      history.pushState({}, '', `?${queryString}`);

      try {
        const rawCards = await apiGet(`/context?${queryString}`);

        const preparedCards = rawCards.map(c => ({
          sentence: c.sentence,
          answer: c.answer,
          hint: c.hint,
          target: c.target,
          distractors: c.distractors || [],
          needsReinsert: false
        }));

        activeQueue.value = shuffleArray(preparedCards);
        appState.value = 'quiz';
        loadNextCard();
      } catch (e) {
        console.error(e.message || "Failed to load cards.");
        appState.value = 'setup';
      }
    };

    const loadNextCard = () => {
      currentCard.value = activeQueue.value[0];
      isAnswerSubmitted.value = false;
      feedback.value = { msg: '', type: '', diff: null };
    };

    const handleAnswerSubmitted = ({ isCorrect, feedbackMsg, diff }) => {
      isAnswerSubmitted.value = true;
      feedback.value = { msg: feedbackMsg, type: isCorrect ? 'success' : 'error', diff };
      if (!isCorrect && currentCard.value) {
        currentCard.value.needsReinsert = true;
      }
    };

    const handlePrimaryAction = () => {
      if (isAnswerSubmitted.value) {
        const { nextQueue, isFinished } = advanceQueue(activeQueue.value);
        activeQueue.value = nextQueue;

        if (isFinished) {
          appState.value = 'finished';
        } else {
          loadNextCard();
        }
      } else if (gameMode.value === 'type') {
        typeFormRef.value?.submitAnswer();
      }
    };

    return {
      appState, dictionary, isLoadingDictionary, filters, 
      wordSearch, availableTags, validationErrors, startDrill,
      activeQueue, currentCard, isAnswerSubmitted, feedback,
      gameMode, showSettingsModal, showFlagModal, typeFormRef, CONTEXT_GAME_MODES,
      currentSentenceParts, handleAnswerSubmitted, handlePrimaryAction,
      addWordToFilters, removeWordFromFilters, FinishedScreen,
      POS, POS_LABELS, PERSON_NUM, PERSON_NUM_LABELS, QTY, QTY_LABELS,
      CASE, CASE_LABELS, SCREEVE, SCREEVE_LABELS, POSTPOSITION, POSTPOSITION_LABELS,
    };
  }
}).mount('#app');
