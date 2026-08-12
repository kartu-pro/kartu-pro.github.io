import { splitSentence } from '/js/textUtils.js';
import CopyButton from '/js/components/CopyButton.js';

const { ref, watch, computed, onMounted, onUnmounted } = Vue;

export default {
  components: {
    'copy-button': CopyButton
  },
  props: {
    card: { type: Object, required: true },
    isSubmitted: { type: Boolean, required: true }
  },
  emits: ['submit', 'next'],
  setup(props, { emit }) {
    const options = ref([]);
    const selectedIndex = ref(-1);

    const parts = computed(() => {
      const targetStr = props.card?.target || props.card?.answer;
      return splitSentence(props.card?.sentence, targetStr);
    });

    watch(() => props.card, (newCard) => {
      if (!newCard) return;
      const pool = [newCard.answer, ...(newCard.distractors || []).slice(0, 3)];
      options.value = pool.sort(() => 0.5 - Math.random());
      selectedIndex.value = -1;
    }, { immediate: true });

    const selectOption = (idx, event) => {
      if (props.isSubmitted) return;

      if (event?.target && typeof event.target.blur === 'function') {
        event.target.blur();
      } else if (document.activeElement) {
        document.activeElement.blur();
      }

      selectedIndex.value = idx;
      const isCorrect = options.value[idx] === props.card.answer;
      
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

      const num = parseInt(e.key);
      if (num >= 1 && num <= options.value.length) {
        e.preventDefault();
        selectOption(num - 1);
      }
    };

    onMounted(() => window.addEventListener('keydown', handleKeydown));
    onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

    return { options, selectedIndex, selectOption, parts };
  },
  template: `
    <div class="flex flex-col flex-1 justify-center items-center gap-4 w-full">
      <div class="quiz-sentence text-center">
        <span class="inline-flex items-center justify-center flex-wrap gap-1">
          <span class="whitespace-nowrap">
            <span>{{ parts.prefix }}</span>
            <span class="cloze-placeholder">___</span>
            <span>{{ parts.suffix }}</span>
          </span>
          <copy-button :text="card.sentence"></copy-button>
        </span>
      </div>

      <div class="grid-2x2 w-full max-w-md mt-4">
        <button 
          v-for="(opt, i) in options" :key="opt"
          @click="selectOption(i, $event)"
          class="choice-card"
          :class="{
            'is-correct': isSubmitted && opt === card.answer,
            'is-wrong': isSubmitted && selectedIndex === i && opt !== card.answer
          }"
        >
          <span class="hotkey-badge">{{ i + 1 }}</span>
          {{ opt }}
        </button>
      </div>
    </div>
  `
};
