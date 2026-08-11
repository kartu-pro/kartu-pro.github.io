/**
 * Shuffles an array in-place or returns a new shuffled copy.
 */
export function shuffleArray(arr) {
  return [...arr].sort(() => 0.5 - Math.random());
}

/**
 * Handles queue progression after a user submits an answer.
 * @returns {{ nextQueue: Array, isFinished: Boolean }}
 */
export function advanceQueue(queue) {
  const activeQueue = [...queue];
  const card = activeQueue.shift();

  if (card && card.needsReinsert) {
    card.needsReinsert = false;
    // Insert back into active queue between 4 and 8 slots away
    const offset = Math.floor(Math.random() * 5) + 4;
    const insertIdx = Math.min(activeQueue.length, offset);
    activeQueue.splice(insertIdx, 0, card);
  }

  return {
    nextQueue: activeQueue,
    isFinished: activeQueue.length === 0
  };
}
