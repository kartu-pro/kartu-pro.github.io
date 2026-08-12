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

    <!-- Inline mode when answer exists in sentence -->
    <div v-if="isAnswerInSentence" class="quiz-sentence text-center">
      <span class="inline-flex items-center justify-center flex-wrap gap-1">
        <span class="whitespace-nowrap">
          <span>{{ parts.prefix }}</span>
          <input type="text" ref="clozeInput" 
            v-model="textInput" 
            @input="handleTextInput"
            @keyup.enter="handleEnter" 
            :readonly="isSubmitted" 
            :placeholder="card.hint"
            class="cloze-input"
            autocomplete="off" autocorrect="off" spellcheck="false" autocapitalize="none"
            :style="{ width: inputWidth }">
          <span>{{ parts.suffix }}</span>
        </span>
        <copy-button :text="card.sentence"></copy-button>
      </span>
    </div>

    <!-- Standalone mode when answer is not in sentence -->
    <div v-else class="flex flex-col items-center gap-6">
      <div class="quiz-sentence text-center inline-flex items-center gap-1">
        <span>{{ card.sentence }}</span>
        <copy-button :text="card.sentence"></copy-button>
      </div>
      
      <input type="text" ref="clozeInput" 
        v-model="textInput" 
        @input="handleTextInput"
        @keyup.enter="handleEnter" 
        :readonly="isSubmitted" 
        :placeholder="card.hint"
        class="cloze-input"
        autocomplete="off" autocorrect="off" spellcheck="false" autocapitalize="none"
        :style="{ width: inputWidth }">
    </div>
  </div>
  `
};
