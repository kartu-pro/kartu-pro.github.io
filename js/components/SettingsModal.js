const { ref, watch } = Vue;

export default {
  props: {
    modelValue: String,
    show: Boolean,
    // [{ value: 'mode_id', label: 'Display Label' }]
    options: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'close'],
  setup(props, { emit }) {
    const localMode = ref(props.modelValue);
    
    watch(() => props.modelValue, (newVal) => {
      localMode.value = newVal;
    });

    const save = () => {
      emit('update:modelValue', localMode.value);
      emit('close');
    };

    return { localMode, save };
  },
  template: `
    <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
      <div class="bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl p-5 w-full max-w-xs shadow-2xl">
        <h3 class="text-lg font-bold border-b border-[var(--color-border)] pb-2 mb-4">Game Mode</h3>
        
        <div class="flex flex-col gap-2 mb-6">
          <label v-for="opt in options" :key="opt.value" 
            class="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-[var(--color-surface-hover)] transition-colors">
            <input type="radio" :value="opt.value" v-model="localMode" class="w-4 h-4 accent-[var(--color-accent)]" />
            <span class="font-semibold text-sm text-[var(--color-text-primary)]">{{ opt.label }}</span>
          </label>
        </div>
        
        <div class="flex justify-end gap-2">
          <button class="btn-secondary text-sm px-3 py-1.5" @click="$emit('close')">Cancel</button>
          <button class="btn-primary text-sm px-3 py-1.5" @click="save">Save</button>
        </div>
      </div>
    </div>
  `
};
