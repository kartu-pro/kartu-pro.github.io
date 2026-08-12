const { ref, watch, onMounted, onUnmounted } = Vue;

export default {
  props: {
    answer: String,
    distractors: { type: Array, default: () => [] },
    isSubmitted: Boolean
  },
  emits: ['submit', 'next'],
  setup(props, { emit }) {
    const options = ref([]);
    const selectedIndex = ref(-1);

    // Watch both answer and distractors cleanly using array getters
    watch([() => props.answer, () => props.distractors], () => {
      const pool = [props.answer, ...(props.distractors || []).slice(0, 3)];
      options.value = pool.sort(() => 0.5 - Math.random());
      selectedIndex.value = -1;
    }, { immediate: true });

    const selectOption = (idx, event) => {
      if (props.isSubmitted) return;

      // Blur the clicked button so Enter key won't trigger a native click on it later
      if (event?.target && typeof event.target.blur === 'function') {
        event.target.blur();
      } else if (document.activeElement) {
        document.activeElement.blur();
      }

      selectedIndex.value = idx;
      const isCorrect = options.value[idx] === props.answer;
      
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

    return { options, selectedIndex, selectOption };
  },
  template: `
    <div class="flex flex-col items-center gap-4 w-full">
      <slot></slot>

      <div class="grid-2x2 w-full max-w-md mt-4">
        <button 
          v-for="(opt, i) in options" :key="opt"
          @click="selectOption(i, $event)"
          class="choice-card"
          :class="{
            'is-correct': isSubmitted && opt === answer,
            'is-wrong': isSubmitted && selectedIndex === i && opt !== answer
          }"
        >
          <span class="hotkey-badge">{{ i + 1 }}</span>
          {{ opt }}
        </button>
      </div>
    </div>
  `
  };
