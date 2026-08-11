const { ref, watch } = Vue;

export default {
  props: ['modelValue', 'show'],
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
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-box">
        <h3 class="text-xl font-bold border-b border-[var(--color-border)] pb-2 mb-4">Game Mode</h3>
        
        <div class="flex flex-col gap-3 mb-6">
          <label class="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-[var(--color-surface-hover)] transition-colors">
            <input type="radio" value="type" v-model="localMode" class="w-4 h-4 accent-[var(--color-accent)]" />
            <span class="font-semibold text-[var(--color-text-primary)]">Type the Form</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-[var(--color-surface-hover)] transition-colors">
            <input type="radio" value="choose" v-model="localMode" class="w-4 h-4 accent-[var(--color-accent)]" />
            <span class="font-semibold text-[var(--color-text-primary)]">Choose the Form</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-[var(--color-surface-hover)] transition-colors">
            <input type="radio" value="mistake" v-model="localMode" class="w-4 h-4 accent-[var(--color-accent)]" />
            <span class="font-semibold text-[var(--color-text-primary)]">Find the Mistake</span>
          </label>
        </div>
        
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="$emit('close')">Cancel</button>
          <button class="btn-primary" @click="save">Save</button>
        </div>
      </div>
    </div>
  `
};
