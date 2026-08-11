const { ref, watch } = Vue;

export default {
  props: ['card', 'isSubmitted'],
  emits: ['submit'],
  setup(props, { emit }) {
    const words = ref([]);
    const mistakeIndex = ref(-1);
    const selectedIndex = ref(-1);
    const actualMistakeWord = ref('');

    watch(() => props.card, () => {
      const distractor = (props.card.distractors && props.card.distractors.length > 0) 
        ? props.card.distractors[Math.floor(Math.random() * props.card.distractors.length)] 
        : '___';
      
      const targetPos = props.card.sentence.indexOf(props.card.answer);
      const modifiedSentence = targetPos !== -1 
        ? props.card.sentence.slice(0, targetPos) + distractor + props.card.sentence.slice(targetPos + props.card.answer.length)
        : props.card.sentence.replace(props.card.answer, distractor);
        
      const splitWords = modifiedSentence.split(' ');
      words.value = splitWords;
      mistakeIndex.value = splitWords.findIndex(w => w.includes(distractor));
      actualMistakeWord.value = distractor;
      selectedIndex.value = -1;
    }, { immediate: true });

    const selectWord = (idx) => {
      if (props.isSubmitted) return;
      selectedIndex.value = idx;
      const isCorrect = idx === mistakeIndex.value;
      
      let msg = isCorrect ? '✅ Correct!' : "❌ Not quite."
      msg += ` "${actualMistakeWord.value}" should be "${props.card.answer}".`;
      
      emit('submit', {
        isCorrect,
        feedbackMsg: msg,
        diff: null
      });
    };

    return { words, mistakeIndex, selectedIndex, selectWord };
  },
  template: `
    <div class="text-2xl sm:text-3xl font-bold flex flex-wrap items-center justify-center gap-x-2 gap-y-3 leading-loose">
      <span 
        v-for="(word, i) in words" :key="i"
        @click="selectWord(i)"
        class="mistake-word"
        :class="{
          'submitted': isSubmitted,
          'incorrect': isSubmitted && selectedIndex === i && i !== mistakeIndex,
          'correct': isSubmitted && i === mistakeIndex
        }"
      >
        {{ word }}
      </span>
    </div>
  `
};
