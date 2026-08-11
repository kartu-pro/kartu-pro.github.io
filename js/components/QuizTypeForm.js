import { transliterate, computeDiff } from '../utils.js';
const { ref, watch, computed, nextTick } = Vue;

export default {
  props: ['card', 'isSubmitted'],
  emits: ['submit', 'next'],
  setup(props, { emit, expose }) {
    const textInput = ref('');
    const clozeInput = ref(null);

    watch(() => props.card, () => {
      textInput.value = '';
      nextTick(() => clozeInput.value?.focus());
    }, { immediate: true });

    const parts = computed(() => {
      const targetPos = props.card.sentence.indexOf(props.card.answer);
      if (targetPos === -1) return { prefix: props.card.sentence, suffix: '' };
      return {
         prefix: props.card.sentence.slice(0, targetPos),
         suffix: props.card.sentence.slice(targetPos + props.card.answer.length)
      };
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
        feedbackMsg: isCorrect ? '✅ Correct!' : '❌ Not quite.',
        diff: isCorrect ? null : computeDiff(textInput.value.trim(), props.card.answer)
      });
    };

    const handleEnter = () => {
      if (props.isSubmitted) emit('next');
      else submitAnswer();
    };

    expose({ submitAnswer });

    return { textInput, clozeInput, parts, handleTextInput, handleEnter };
  },
  template: `
    <div class="text-2xl sm:text-3xl font-bold flex flex-wrap items-center justify-center gap-1 leading-loose">
      <span>{{ parts.prefix }}</span>
      
      <input type="text" ref="clozeInput" 
        v-model="textInput" 
        @input="handleTextInput"
        @keyup.enter="handleEnter" 
        :readonly="isSubmitted" 
        :placeholder="card.hint"
        class="cloze-input text-2xl sm:text-3xl"
        autocomplete="off" autocorrect="off" spellcheck="false"
        :style="{ width: Math.max((card.hint?.length || 5), (card.answer?.length || textInput.length) + 3) + 'ch' }">
        
      <span>{{ parts.suffix }}</span>
    </div>
  `
};
