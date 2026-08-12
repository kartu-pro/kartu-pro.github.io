const { ref, watch, onMounted, onUnmounted } = Vue;
import { computeDiff } from '../utils.js';

export default {
  props: {
    card: Object,
    isSubmitted: Boolean
  },
  emits: ['submit', 'next'],
  setup(props, { emit }) {
    const words = ref([]);
    const mistakeIndex = ref(-1);
    const selectedIndex = ref(-1);
    const actualMistakeWord = ref('');

    const getLetter = (i) => String.fromCharCode(65 + i);

    watch(() => props.card, () => {
      if (!props.card) return;

      const distractor = (props.card.distractors && props.card.distractors.length > 0)
        ? props.card.distractors[Math.floor(Math.random() * props.card.distractors.length)]
        : '___';

      const targetWord = props.card.answer;
      const targetPos = props.card.sentence.indexOf(targetWord);

      const modifiedSentence = targetPos !== -1
        ? props.card.sentence.slice(0, targetPos) + distractor + props.card.sentence.slice(targetPos + targetWord.length)
        : props.card.sentence.replace(props.card.answer, distractor);

      const splitWords = modifiedSentence.split(' ');
      words.value = splitWords;
      mistakeIndex.value = splitWords.findIndex(w => w.includes(distractor));
      actualMistakeWord.value = distractor;
      selectedIndex.value = -1;
    }, { immediate: true });

    const selectWord = (idx, event) => {
      if (props.isSubmitted) return;

      if (event?.target && typeof event.target.blur === 'function') {
        event.target.blur();
      } else if (document.activeElement) {
        document.activeElement.blur();
      }

      selectedIndex.value = idx;
      const isCorrect = idx === mistakeIndex.value;
      const targetWord = props.card.target || props.card.answer;

      emit('submit', {
        isCorrect,
        feedbackMsg: isCorrect ? 'Correct!' : 'Not quite.',
        diff: null
      });
    };

    const handleKeydown = (e) => {
      if (e.key === 'Enter') {
        if (props.isSubmitted) {
          e.preventDefault();
          if (document.activeElement) document.activeElement.blur();
          emit('next');
        }
        return;
      }

      if (props.isSubmitted) return;

      const key = e.key.toUpperCase();
      if (key >= 'A' && key <= 'Z') {
        const idx = key.charCodeAt(0) - 65;
        if (idx >= 0 && idx < words.value.length) {
          e.preventDefault();
          selectWord(idx);
        }
      }
    };

    onMounted(() => window.addEventListener('keydown', handleKeydown));
    onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

    return { words, selectedIndex, mistakeIndex, selectWord, getLetter };
  },
  template: `
<div class="flex flex-col items-center gap-4 w-full">
    <div class="flex flex-wrap items-center justify-center gap-1-5 max-w-2xl quiz-sentence-flow">
      <button 
        v-for="(word, i) in words" 
        :key="i"
        @click="selectWord(i, $event)"
        :class="{
          /* Pre-submit state */
          'is-selected': selectedIndex === i && !isSubmitted,

          /* Always mark mistake word in yellow highlight with strikethrough */
          'diff-insertion line-through': isSubmitted && i === mistakeIndex,

          /* Dim clean unselected words */
          'is-disabled': isSubmitted && i !== mistakeIndex && selectedIndex !== i
        }"
        class="interactive-word-text relative"

        :style="(isSubmitted && selectedIndex === i && i !== mistakeIndex) ? { color: 'var(--color-accent)' }: {}"
      >
        <!-- Correct word floating above the mistake using diff-match -->
        <span 
          v-if="isSubmitted && i === mistakeIndex" 
          class="floating-correction-badge diff-match"
        >
          {{ card.answer }}
        </span>

        <span v-if="!isSubmitted" class="hotkey-badge-subtle">{{ getLetter(i) }}</span>
        <span>{{ word }}</span>
      </button>
    </div>
  </div>
  `
};
