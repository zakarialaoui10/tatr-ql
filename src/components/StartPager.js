export const StartPager = async () => {
  await new Promise((resolve) =>
    window.requestAnimationFrame(resolve)
  );

  const page = () =>
    Math.max(1, window.innerHeight - 1);

  const height = () =>
    document.body.scrollHeight;

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

    g: () => window.scrollBy(0, -height()),
    G: () => window.scrollBy(0, height()),

    q: () => term.window.close()
  };

  document.addEventListener("keydown", (event) => {
    const key = event.key;

    const handler = bindings[key];

    if (!handler) return;

    handler();
  });
};