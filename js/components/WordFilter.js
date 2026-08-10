const { ref, computed, onMounted, onUnmounted } = Vue;
const WordFilter = {
  props: {
    modelValue: String, // for wordSearch
    dictionary: Array,
    topic: String,
    selectedWords: Array, // filters.value.words
  },
  emits: ['update:modelValue', 'addWord', 'removeWord'],
  setup(props, { emit }) {
    const showWordDropdown = ref(false);
    const wordSearchInputRef = ref(null);

    const filteredDictionary = computed(() => {
      if (!props.modelValue) return [];
      const q = props.modelValue.toLowerCase();
      return props.dictionary.filter(w =>
        w.pos === props.topic &&
        !props.selectedWords.some(sw => sw.uuid === w.uuid) &&
        (w.lemma.toLowerCase().includes(q) || w.en.toLowerCase().includes(q))
      );
    });

    const handleInput = (e) => {
      emit('update:modelValue', e.target.value);
      showWordDropdown.value = true;
    };

    const handleAddWord = (word) => {
      emit('addWord', word);
      emit('update:modelValue', ''); // Clear search input after selecting
      showWordDropdown.value = false;
    };

    const closeDropdowns = (e) => {
      // Close dropdown if click is outside the component
      if (wordSearchInputRef.value && !wordSearchInputRef.value.contains(e.target)) {
        showWordDropdown.value = false;
      }
    };

    onMounted(() => {
      window.addEventListener('click', closeDropdowns);
    });

    onUnmounted(() => {
      window.removeEventListener('click', closeDropdowns);
    });

    return {
      showWordDropdown,
      filteredDictionary,
      handleInput,
      handleAddWord,
      wordSearchInputRef,
    };
  },
  template: `
      <div class="mb-4 relative" ref="wordSearchInputRef">
        <label class="block text-xs font-bold text-secondary mb-1">Words</label>
        <div class="flex flex-wrap gap-1.5 mb-2" v-if="selectedWords.length">
          <span v-for="word in selectedWords" :key="word.uuid"
            class="inline-flex items-center px-2 py-1 bg-[var(--color-surface)] text-xs font-bold rounded border border-[var(--color-border)]">
            {{ word.lemma }}
            <button @click="$emit('removeWord', word)"
              class="ml-1.5 text-secondary hover:text-[var(--color-accent)]">✕</button>
          </span>
        </div>
        <input type="text" :value="modelValue" @input="handleInput" placeholder="Type to search..."
          class="input-text text-sm">

        <div v-if="showWordDropdown && filteredDictionary.length"
          class="absolute z-10 w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded shadow-lg max-h-40 overflow-y-auto mt-1">
          <div v-for="item in filteredDictionary" :key="item.uuid" @click="handleAddWord(item)"
            class="p-2 hover:bg-[var(--color-surface)] cursor-pointer text-sm flex justify-between border-b border-[var(--color-border)]">
            <span class="font-bold">{{ item.lemma }}</span>
            <span class="text-secondary">{{ item.en }}</span>
          </div>
        </div>
      </div>
  `
};

export default WordFilter;
