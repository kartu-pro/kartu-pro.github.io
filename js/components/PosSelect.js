const PosSelect = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <div class="card-box">
      <label class="block font-bold text-sm mb-2">Part of Speech</label>
      <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)" class="input-text">
        <option value="" disabled>Select a topic...</option>
        <option value="verb">Verbs</option>
        <option value="noun">Nouns</option>
        <option value="pron">Pronouns</option>
        <option value="adj">Adjectives</option>
      </select>
    </div>
  `
};

export default PosSelect;
