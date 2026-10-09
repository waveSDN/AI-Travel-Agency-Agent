/* Runs before first paint: marks that JavaScript is on, so the scroll-driven hero track and the dialogs
   only take effect when their scripts will run. Kept tiny and external (no inline scripts under the CSP). */
document.documentElement.classList.add('js');
