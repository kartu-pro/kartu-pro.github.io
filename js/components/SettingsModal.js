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
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-box modal-sm">
        <h3 class="modal-title">Game Mode</h3>
        
        <div class="flex flex-col gap-2 mb-4">
          <label v-for="opt in options" :key="opt.value" class="modal-option">
            <input type="radio" :value="opt.value" v-model="localMode" class="radio-input" />
            <span>{{ opt.label }}</span>
          </label>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary mr-2" @click="$emit('close')">Cancel</button>
          <button type="button" class="btn-primary" @click="save">Save</button>
        </div>
      </div>
    </div>
  `
};
