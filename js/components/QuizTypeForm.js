import { transliterate, computeDiff, splitSentence } from '/js/textUtils.js';
import CopyButton from '/js/components/CopyButton.js';

const { ref, watch, computed, nextTick } = Vue;

export default {
  components: {
    'copy-button': CopyButton
  },
  props: ['card', 'isSubmitted'],
  emits: ['submit', 'next'],
  setup(props, { emit, expose }) {
    const textInput = ref('');
    const clozeInput = ref(null);

    watch(() => props.card, () => {
      textInput.value = '';
      nextTick(() => clozeInput.value?.focus());
    }, { immediate: true });

    const isAnswerInSentence = computed(() => {
      if (!props.card?.sentence || !props.card?.answer) return false;
      return props.card.sentence.indexOf(props.card.answer) !== -1;
    });

    const parts = computed(() => {
      return splitSentence(props.card?.sentence, props.card?.answer);
    });

    const inputWidth = computed(() => {
      const hintLen = props.card?.hint?.length || 0;
      const answerLen = props.card?.answer?.length || 0;
      return Math.max(hintLen, answerLen) + 4 + 'ch';
    });

    const handleTextInput = (e) => {
      if (props.isSubmitted) return;
      const input = e.target;
      const cursorStart = input.selectionStart;
      const lengthBefore = input.value.length;
      
      const transformed = transliterate(input.value);
      textInput.value = transformed;
      
      nextTick(() => {
        const lengthDiff = transformed.length - lengthBefore;
        const newPos = Math.max(0, cursorStart + lengthDiff);
        input.setSelectionRange(newPos, newPos);
      });
    };

    const submitAnswer = () => {
      if (!textInput.value.trim()) return;
      const isCorrect = textInput.value.trim() === props.card.answer;
      emit('submit', {
        isCorrect,
        feedbackMsg: isCorrect ? 'Correct!' : 'Not quite.',
        diff: isCorrect ? null : computeDiff(textInput.value.trim(), props.card.answer)
      });
    };

    const handleEnter = () => {
      if (props.isSubmitted) emit('next');
      else submitAnswer();
    };

    expose({ submitAnswer });

    return { textInput, clozeInput, inputWidth, isAnswerInSentence, parts, handleTextInput, handleEnter };
  },
  template: `
  <div class="w-full flex flex-col items-center">
    <div class="quiz-sentence text-center flex items-center justify-center flex-wrap gap-2"
         :class="{ 'flex-col': !isAnswerInSentence }">
      
      <!-- Standalone Header (Sentence + Copy) -->
      <div v-if="!isAnswerInSentence" class="inline-flex items-center gap-2">
        <span>{{ card.sentence }}</span>
        <copy-button :text="card.sentence"></copy-button>
      </div>

      <!-- Inline Prefix -->
      <span v-else class="whitespace-nowrap">{{ parts.prefix }}</span>

      <!-- Single Shared Input -->
      <div class="relative flex items-center">
        <input type="text" ref="clozeInput" 
          v-model="textInput" 
          @input="handleTextInput"
          @keydown.enter.prevent="handleEnter" 
          :placeholder="card.hint"
          class="cloze-input"
          autocomplete="off" autocorrect="off" spellcheck="false" autocapitalize="none"
          :enterkeyhint="isSubmitted ? 'next' : 'go'"
          :style="{ width: inputWidth }">
        <span class="font-bold" style="font-size: 1.25em;">↵</span>
      </div>

      <!-- Inline Suffix & Copy -->
      <template v-if="isAnswerInSentence">
        <span class="whitespace-nowrap">{{ parts.suffix }}</span>
        <copy-button :text="card.sentence" class="ml-1"></copy-button>
      </template>
    </div>
  </div>
  `
};
