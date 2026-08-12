import { apiPost } from '../api.js';

export default {
  name: 'FlagContent',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    appState: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { ref } = Vue;
    const message = ref('');
    const isSending = ref(false);

    const handleClose = () => {
      message.value = '';
      emit('close');
    };

    const handleSend = async () => {
      if (!message.value.trim()) return;

      isSending.value = true;
      try {
        await apiPost('/flag', {
          state: props.appState,
          message: message.value.trim()
        });
        handleClose();
      } catch (err) {
        console.error('Failed to submit flag:', err);
      } finally {
        isSending.value = false;
      }
    };

    return {
      message,
      isSending,
      handleClose,
      handleSend
    };
  },
  template: `
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-box">
        <h3 class="modal-title">Flag Content</h3>
        <textarea
          v-model="message"
          class="input-text w-full mb-4"
          rows="4"
          placeholder="Describe the issue with this content..."
          :disabled="isSending"
        ></textarea>
        <div class="modal-actions gap-2">
          <button class="btn-secondary" @click="handleClose" :disabled="isSending">
            Cancel
          </button>
          <button class="btn-primary" @click="handleSend" :disabled="isSending || !message.trim()">
            {{ isSending ? 'Sending...' : 'Send' }}
          </button>
        </div>
      </div>
    </div>
  `
};