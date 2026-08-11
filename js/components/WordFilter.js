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
    <div class="word-filter relative mb-4" ref="wordSearchInputRef">
      <label class="filter-label text-secondary font-bold text-xs mb-1 block">Words</label>

      <div class="flex flex-wrap gap-1-5 mb-2" v-if="selectedWords.length">
        <span v-for="word in selectedWords" :key="word.uuid" class="selected-chip">
          {{ word.lemma }}
          <button type="button" @click="$emit('removeWord', word)" class="btn-chip-remove">✕</button>
        </span>
      </div>

      <input type="text" :value="modelValue" @input="handleInput" placeholder="Type to search..." class="input-text">

      <div v-if="showWordDropdown && filteredDictionary.length" class="search-dropdown">
        <div v-for="item in filteredDictionary" :key="item.uuid" @click="handleAddWord(item)" class="search-dropdown-item">
          <span class="font-bold">{{ item.lemma }}</span>
          <span class="text-secondary">{{ item.en }}</span>
        </div>
      </div>
    </div>
  `
  };

export default WordFilter;
