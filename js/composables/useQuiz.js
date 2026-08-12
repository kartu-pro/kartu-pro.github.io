const { ref } = Vue;

// --- Private Helpers ---
function shuffleArray(arr) {
  return [...arr].sort(() => 0.5 - Math.random());
}

function advanceQueue(queue) {
  const activeQueue = [...queue];
  const card = activeQueue.shift();

  if (card && card.needsReinsert) {
    card.needsReinsert = false;
    // Insert back into active queue between 4 and 8 slots away
    const offset = Math.floor(Math.random() * 5) + 4;
    const insertIdx = Math.min(activeQueue.length, offset);
    activeQueue.splice(insertIdx, 0, card);
  }

  return {
    nextQueue: activeQueue,
    isFinished: activeQueue.length === 0
  };
}

// --- Composable ---
export function useQuiz(fetchCardsFn) {
  const appState = ref('setup');
  const activeQueue = ref([]);
  const currentCard = ref(null);
  const isAnswerSubmitted = ref(false);
  const feedback = ref({ msg: '', type: '', diff: null });

  const loadNextCard = () => {
    currentCard.value = activeQueue.value[0];
    isAnswerSubmitted.value = false;
    feedback.value = { msg: '', type: '', diff: null };
  };

  const startDrill = async (fetchParams) => {
    appState.value = 'loading';
    try {
      const cards = await fetchCardsFn(fetchParams);
      if (!cards || cards.length === 0) {
        appState.value = 'setup';
        return;
      }
      activeQueue.value = shuffleArray(cards);
      appState.value = 'quiz';
      loadNextCard();
    } catch (e) {
      console.error('Failed to load cards:', e);
      appState.value = 'setup';
    }
  };

  const handleAnswerSubmitted = ({ isCorrect, feedbackMsg, diff }) => {
    isAnswerSubmitted.value = true;
    feedback.value = { msg: feedbackMsg, type: isCorrect ? 'success' : 'error', diff };
    if (!isCorrect && currentCard.value) {
      currentCard.value.needsReinsert = true;
    }
  };

  const advanceCard = () => {
    const { nextQueue, isFinished } = advanceQueue(activeQueue.value);
    activeQueue.value = nextQueue;

    if (isFinished) {
      appState.value = 'finished';
    } else {
      loadNextCard();
    }
  };

  return {
    appState,
    activeQueue,
    currentCard,
    isAnswerSubmitted,
    feedback,
    startDrill,
    handleAnswerSubmitted,
    advanceCard
  };
}