(() => {
  "use strict";

  const loader = document.getElementById("page-loader");

  if (!loader) {
    return;
  }

  const HIDE_CLASS = "is-hidden";
  const FADE_DURATION = 400;
  // Keep the loader on screen long enough to enjoy the animation.
  // 2400ms = exactly two full bounces (the bounce cycle is 1.2s).
  const MIN_VISIBLE = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 2400;
  // Safety net: never keep visitors waiting longer than this.
  const MAX_VISIBLE = 8000;

  let hidden = false;

  function hideLoader() {
    if (hidden) {
      return;
    }

    hidden = true;
    loader.classList.add(HIDE_CLASS);

    window.setTimeout(() => {
      loader.remove();
    }, FADE_DURATION);
  }

  // Hide once the page has finished loading AND the minimum time has passed.
  // performance.now() counts from the start of navigation, so time already
  // spent loading is not added on top of the minimum.
  function hideWhenReady() {
    const remaining = Math.max(0, MIN_VISIBLE - performance.now());
    window.setTimeout(hideLoader, remaining);
  }

  if (document.readyState === "complete") {
    hideWhenReady();
  } else {
    window.addEventListener("load", hideWhenReady, { once: true });
  }

  window.setTimeout(hideLoader, MAX_VISIBLE);

})();
