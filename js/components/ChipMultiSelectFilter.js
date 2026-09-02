const ChipMultiSelectFilter = {
  props: {
    label: String,
    items: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: Array,
      default: () => [] // <--- Prevents undefined crashes
    },
    itemMap: Object,
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  methods: {
    toggleItem(item) {
      if (this.disabled) return;
      const currentSelection = [...(this.modelValue || [])];
      const idx = currentSelection.indexOf(item);
      if (idx > -1) {
        currentSelection.splice(idx, 1);
      } else {
        currentSelection.push(item);
      }
      this.$emit('update:modelValue', currentSelection);
    },
    selectAll() {
      if (this.disabled) return;
      this.$emit('update:modelValue', [...(this.items || [])]);
    },
    selectNone() {
      if (this.disabled) return;
      this.$emit('update:modelValue', []);
    }
  },
  template: `
    <div class="filter-group mb-3">
      <div class="filter-header flex justify-between items-center mb-1">
        <span class="filter-label text-secondary font-bold text-xs">{{ label }}</span>
        <div class="flex gap-2">
          <button type="button" class="btn-link text-secondary" @click="selectNone" :disabled="disabled">None</button>
          <button type="button" class="btn-link text-accent" @click="selectAll" :disabled="disabled">All</button>
        </div>
      </div>
      <div class="flex flex-wrap gap-1-5">
        <button v-for="item in items" :key="item"
          type="button"
          class="filter-chip"
          :class="{ 'active': modelValue.includes(item) }"
          :disabled="disabled"
          @click="toggleItem(item)">
          {{ itemMap ? itemMap[item] : item }}
        </button>
      </div>
    </div>
  `
};

export default ChipMultiSelectFilter;
