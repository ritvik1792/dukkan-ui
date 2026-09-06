/** Run after the off-screen drawer frame has painted, so translate can animate. */
export function afterPaint(fn: () => void) {
  let inner = 0;
  const outer = window.requestAnimationFrame(() => {
    inner = window.requestAnimationFrame(fn);
  });
  return () => {
    window.cancelAnimationFrame(outer);
    window.cancelAnimationFrame(inner);
  };
}
