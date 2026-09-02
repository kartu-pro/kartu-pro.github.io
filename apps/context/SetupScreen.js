import PosSelect from '/js/components/PosSelect.js';
import WordFilter from '/js/components/WordFilter.js';
import ChipMultiSelectFilter from '/js/components/ChipMultiSelectFilter.js';

import { validateFilters } from './filters.js';

import {
  SCREEVE, SCREEVE_LABELS,
  PERSON_NUM, PERSON_NUM_LABELS,
  QTY, QTY_LABELS,
  CASE, CASE_LABELS,
  POSTPOSITION, POSTPOSITION_LABELS
} from '/js/constants.js';

const { ref, computed } = Vue;

export default {
  components: {
    'pos-select': PosSelect,
    'word-filter': WordFilter,
    'chip-multi-select-filter': ChipMultiSelectFilter,
  },
  props: {
    filters: { type: Object, required: true },
    dictionary: { type: Array, default: () => [] },
    isLoadingDictionary: { type: Boolean, default: false }
  },
  emits: ['start'],
  setup(props, { emit }) {
    const wordSearch = ref('');

    const validationErrors = computed(() => validateFilters(props.filters));

    const availableTags = computed(() => {
      const tags = new Set();
      props.dictionary
        .filter(w => w.pos === props.filters.topic)
        .forEach(w => w.tags?.forEach(t => tags.add(t)));
      return Array.from(tags).sort();
    });

    const addWordToFilters = (w) => {
      props.filters.words.push(w);
      wordSearch.value = '';
    };

    const removeWordFromFilters = (w) => {
      const index = props.filters.words.findIndex(x => x.uuid === w.uuid);
      if (index !== -1) {
        props.filters.words.splice(index, 1);
      }
    };

    return {
      wordSearch,
      validationErrors,
      availableTags,
      addWordToFilters,
      removeWordFromFilters,
      SCREEVE, SCREEVE_LABELS,
      PERSON_NUM, PERSON_NUM_LABELS,
      QTY, QTY_LABELS,
      CASE, CASE_LABELS,
      POSTPOSITION, POSTPOSITION_LABELS,
    };
  },
  template: `
    <div class="flex-1 flex flex-col min-h-0">
      <!-- Fixed Header -->
      <div class="flex-none">
        <h2>What do you want to study?</h2>
      </div>

      <!-- Scrollable Filters Container -->
      <div class="flex-1 overflow-y-auto flex flex-col gap-4 min-h-0">
        <pos-select v-model="filters.topic"></pos-select>

        <!-- Grammar Filters -->
        <div v-if="filters.topic" class="card-box">
          <h3 class="card-title">Grammar Filters</h3>

          <!-- VERBS -->
          <template v-if="filters.topic === 'verb'">
            <chip-multi-select-filter label="Screeve" :items="Object.values(SCREEVE)" v-model="filters.scr"
              :item-map="SCREEVE_LABELS"></chip-multi-select-filter>

            <chip-multi-select-filter label="Subject" :items="Object.values(PERSON_NUM)" v-model="filters.subj"
              :item-map="PERSON_NUM_LABELS"></chip-multi-select-filter>
          </template>

          <!-- CASES -->
          <template v-if="['noun', 'pron', 'adj'].includes(filters.topic)">
            <chip-multi-select-filter label="Case" :items="Object.values(CASE)" v-model="filters.case"
              :item-map="CASE_LABELS"></chip-multi-select-filter>
          </template>

          <!-- QTY -->
          <template v-if="['noun'].includes(filters.topic)">
            <chip-multi-select-filter label="Quantity" :items="Object.values(QTY)" v-model="filters.qty"
              :item-map="QTY_LABELS"></chip-multi-select-filter>
          </template>

          <!-- POSTPOSITIONS -->
          <template v-if="['noun'].includes(filters.topic)">
            <chip-multi-select-filter label="Postpositions" :items="Object.values(POSTPOSITION)" v-model="filters.pp"
              :item-map="POSTPOSITION_LABELS"></chip-multi-select-filter>
          </template>
        </div>

        <!-- Vocab Filters -->
        <div v-if="filters.topic" class="card-box">
          <h3 class="card-title">
            {{ isLoadingDictionary ? 'Loading Word Filters...' : 'Word Filters' }}
          </h3>
          <word-filter v-model="wordSearch" :dictionary="dictionary" :topic="filters.topic"
            :selected-words="filters.words" @add-word="addWordToFilters" @remove-word="removeWordFromFilters"
            :disabled="isLoadingDictionary || !filters.topic">
          </word-filter>

          <chip-multi-select-filter label="Tags" :items="availableTags" v-model="filters.tags"
            :disabled="isLoadingDictionary || !filters.topic"></chip-multi-select-filter>
        </div>
      </div>

      <!-- Fixed Bottom Bar / Validation Errors -->
      <div class="flex-none pt-3">
        <div v-if="validationErrors.length > 0" class="validation-box">
          <ul>
            <li v-for="err in validationErrors" :key="err">{{ err }}</li>
          </ul>
        </div>

        <button class="btn-primary w-full" @click="$emit('start')" :disabled="validationErrors.length > 0">
          Start
        </button>
      </div>
    </div>
  `
};
