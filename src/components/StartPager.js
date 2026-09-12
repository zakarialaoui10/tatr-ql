export const StartPager = async () => {
  // Let TermDOM finish its initial layout.
  await new Promise((resolve) =>
    window.requestAnimationFrame(resolve)
  );

  await new Promise((resolve) =>
    window.requestAnimationFrame(resolve)
  );

  // Reset the camera after layout has settled.
  window.scrollTo(0, 0);

  const page = () => Math.max(1, window.innerHeight - 1);

  const height = () =>
    Math.max(
      0,
      document.body.scrollHeight - window.innerHeight
    );

  const bindings = {
    " ": () => window.scrollBy(0, page()),
    f: () => window.scrollBy(0, page()),
    PageDown: () => window.scrollBy(0, page()),

    b: () => window.scrollBy(0, -page()),
    PageUp: () => window.scrollBy(0, -page()),

    j: () => window.scrollBy(0, 1),
    ArrowDown: () => window.scrollBy(0, 1),

    k: () => window.scrollBy(0, -1),
    ArrowUp: () => window.scrollBy(0, -1),

    g: () => window.scrollTo(0, 0),

    G: () =>
      window.scrollTo(
        0,
        height()
      ),

    q: () =>
      term.window.close()
  };

  document.addEventListener(
    "keydown",
    (event) => {
      bindings[event.key]?.();
    }
  );
};