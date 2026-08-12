export const routingExplanation = Object.freeze({
  text:
    'This site is not hooked up to an LLM API, otherwise someone would inevitably turn up and ask it to write code. Running a full local LLM in a lightweight static site is not practical either, so it uses a lightweight, similarity-based heuristic router instead.',
});

export function shouldShowRoutingExplanation(event) {
  return event?.type === 'done' && event.intentId === 'unknown';
}
