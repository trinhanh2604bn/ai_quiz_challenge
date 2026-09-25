export function keepFocusInside(event: KeyboardEvent): void {
  if (event.key !== 'Tab') {
    return;
  }

  const dialog = event.currentTarget;
  if (!(dialog instanceof HTMLElement)) {
    return;
  }

  const focusable = [...dialog.querySelectorAll<HTMLElement>('button, input, a[href]')].filter(
    (element) => !element.hasAttribute('disabled'),
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) {
    return;
  }

  const active = document.activeElement;
  if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && (active === last || !dialog.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}
