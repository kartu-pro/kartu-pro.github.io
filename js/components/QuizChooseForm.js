const { ref, watch, computed, onMounted, onUnmounted } = Vue;

export default {
  props: ['card', 'isSubmitted'],
  emits: ['submit', 'next'],
  setup(props, { emit }) {
    const options = ref([]);
    const selectedIndex = ref(-1);

    watch(() => props.card, () => {
      const pool = [props.card.answer];
      if (props.card.distractors) {
        pool.push(...props.card.distractors.slice(0, 3)); 
      }
      options.value = pool.sort(() => 0.5 - Math.random());
      selectedIndex.value = -1;
    }, { immediate: true });

    const parts = computed(() => {
      const targetPos = props.card.sentence.indexOf(props.card.answer);
      if (targetPos === -1) return { prefix: props.card.sentence, suffix: '' };
      return {
         prefix: props.card.sentence.slice(0, targetPos),
         suffix: props.card.sentence.slice(targetPos + props.card.answer.length)
      };
    });

    const selectOption = (idx) => {
      if (props.isSubmitted) return;
      selectedIndex.value = idx;
      const isCorrect = options.value[idx] === props.card.answer;
      
      emit('submit', {
        isCorrect,
        feedbackMsg: isCorrect ? '✅ Correct!' : '❌ Not quite.',
        diff: null
      });
    };

    const handleKeydown = (e) => {
      if (props.isSubmitted) {
        if (e.key === 'Enter') emit('next');
        return;
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= options.value.length) {
        selectOption(num - 1);
      }
    };

    onMounted(() => window.addEventListener('keydown', handleKeydown));
    onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

    return { options, selectedIndex, parts, selectOption };
  },
  template: `
    <div class="w-full flex flex-col items-center gap-6">
      <div class="text-2xl sm:text-3xl font-bold flex flex-wrap items-center justify-center gap-1 leading-loose">
        <span>{{ parts.prefix }}</span>
        <span class="text-[var(--color-text-secondary)] border-b-[3px] border-[var(--color-text-primary)] px-4">___</span>
        <span>{{ parts.suffix }}</span>
      </div>

      <div class="grid-2x2 w-full max-w-md mt-4">
        <button 
          v-for="(opt, i) in options" :key="i"
          @click="selectOption(i)"
          class="choice-btn"
          :class="{
            'correct': isSubmitted && opt === card.answer,
            'incorrect': isSubmitted && selectedIndex === i && opt !== card.answer
          }"
        >
          <span class="hotkey-badge">{{ i + 1 }}</span>
          {{ opt }}
        </button>
      </div>
    </div>
  `
};
