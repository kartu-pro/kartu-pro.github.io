// ../../js/components/QuizFeedback.js
export default {
  props: ['feedback'],
  template: `
    <div class="feedback-container">
      <div v-if="feedback.msg" :class="{'text-success': feedback.type === 'success', 'text-accent': feedback.type === 'error'}">
        {{ feedback.msg }}
      </div>
      <div v-if="feedback.type === 'error' && feedback.diff">
        <span v-for="(part, i) in feedback.diff" :key="i" :class="'diff-' + part.type" class="diff-char">
          {{ part.char }}
        </span>
      </div>
    </div>
  `
};