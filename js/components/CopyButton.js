const { ref } = Vue;

export default {
  props: {
    text: { type: String, required: true }
  },
  setup(props) {
    const copied = ref(false);

    const copyText = async () => {
      if (!props.text) return;
      try {
        await navigator.clipboard.writeText(props.text);
        copied.value = true;
        setTimeout(() => { copied.value = false; }, 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    };

    return { copied, copyText };
  },
  template: `
    <button 
      type="button" 
      class="inline-flex items-center justify-center text-secondary hover:text-primary transition-colors p-1 rounded" 
      @click.stop="copyText" 
      :title="copied ? 'Copied!' : 'Copy sentence'"
    >
      <!-- Checkmark Icon when copied -->
      <svg v-if="copied" class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <!-- Clipboard Icon -->
      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  `
};