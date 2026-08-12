import QuizFeedback from '/js/components/QuizFeedback.js';
import QuizChooseForm from '/js/components/QuizChooseForm.js';
import QuizTypeForm from '/js/components/QuizTypeForm.js';

const { ref } = Vue;

export default {
  components: {
    'quiz-feedback': QuizFeedback,
    'quiz-choose-form': QuizChooseForm,
    'quiz-type-form': QuizTypeForm,
  },
  props: {
    currentCard: { type: Object, default: null },
    activeQueueLength: { type: Number, default: 0 },
    feedback: { type: Object, required: true },
    gameMode: { type: String, required: true },
    isAnswerSubmitted: { type: Boolean, required: true },
  },
  emits: ['submit', 'next'],
  setup(props, { emit }) {
    const typeFormRef = ref(null);

    const handlePrimaryAction = () => {
      if (props.isAnswerSubmitted) {
        emit('next');
      } else if (props.gameMode === 'type') {
        typeFormRef.value?.submitAnswer();
      }
    };

    const handleAnswerSubmitted = (payload) => {
      emit('submit', payload);
    };

    return {
      typeFormRef,
      handlePrimaryAction,
      handleAnswerSubmitted
    };
  },
  template: `
    <div class="flex-1 flex flex-col min-h-0 justify-between">
      <div class="card-box flex-1 flex flex-col items-center justify-center text-center relative" v-if="currentCard">
        <span class="text-secondary text-xs" style="position: absolute; top: 0.75rem; right: 1rem;">
          Remaining: {{ activeQueueLength }}
        </span>

        <!-- Shared Feedback Header -->
        <quiz-feedback :feedback="feedback"></quiz-feedback>

        <!-- Dynamic Game Modes -->
        <quiz-choose-form 
          v-if="gameMode === 'choose_translation'"
          :card="currentCard"
          :is-submitted="isAnswerSubmitted" 
          @submit="handleAnswerSubmitted"
          @next="handlePrimaryAction"
        ></quiz-choose-form>

        <quiz-choose-form 
          v-else-if="gameMode === 'choose_form'" 
          :card="currentCard"
          :is-submitted="isAnswerSubmitted" 
          @submit="handleAnswerSubmitted"
          @next="handlePrimaryAction"
        ></quiz-choose-form>

        <quiz-type-form 
          v-else-if="gameMode === 'type'" 
          ref="typeFormRef" 
          :card="currentCard"
          :is-submitted="isAnswerSubmitted" 
          @submit="handleAnswerSubmitted"
          @next="handlePrimaryAction"
        ></quiz-type-form>
      </div>

      <div class="flex-none">
        <button class="btn-primary w-full" :class="{ 'btn-pulse': isAnswerSubmitted }" @click="handlePrimaryAction"
          :disabled="!isAnswerSubmitted && gameMode !== 'type'">
          {{ isAnswerSubmitted ? 'Next (Enter)' : (gameMode === 'type' ? 'Check Answer (Enter)' : 'Select an Option') }}
        </button>
      </div>
    </div>
  `
};
