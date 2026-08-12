export default {
  emits: ['restart', 'setup'],
  template: `
    <div class="text-center flex-1 flex flex-col items-center justify-center">
      <h2>Review Complete! 🎉</h2>
      <p class="subtitle">Great practice session.</p>

      <div class="finished-actions">
        <button class="btn-primary flex-1" @click="$emit('restart')">
          Load More Exercises
        </button>
        <button class="btn-secondary flex-1" @click="$emit('setup')">
          Back to Setup
        </button>
      </div>
    </div>
  `
};