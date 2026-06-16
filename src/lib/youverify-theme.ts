/** Read Flowcheq CSS variables and map them to YouVerify SDK appearance hex colors. */

function hslTripletToHex(hsl: string): string {
  const parts = hsl.trim().split(/\s+/);
  if (parts.length < 3) return '#007AFF';

  const hRaw = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const h = Number.isFinite(hRaw) ? hRaw / 360 : 0;

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getYouverifySdkAppearance(copy?: {
  greeting?: string;
  actionText?: string;
}) {
  const root = document.documentElement;
  const styles = getComputedStyle(root);

  const primary = styles.getPropertyValue('--primary').trim();
  const primaryFg = styles.getPropertyValue('--primary-foreground').trim();
  const foreground = styles.getPropertyValue('--foreground').trim();

  const primaryColor = hslTripletToHex(primary || '211 100% 50%');
  const buttonTextColor = hslTripletToHex(primaryFg || '0 0% 100%');
  const textColor = hslTripletToHex(foreground || '0 0% 10%');

  return {
    greeting:
      copy?.greeting ??
      'Verify your identity with your NIN and a quick liveness check. This stays on Flowcheq — powered by YouVerify.',
    actionText: copy?.actionText ?? 'Start verification',
    primaryColor,
    buttonBackgroundColor: primaryColor,
    buttonTextColor,
    textColor,
  };
}

/** Move YouVerify body-level modal nodes into our in-page host container. */
export function embedYouverifySdkInHost(host: HTMLElement): () => void {
  const applyLayout = () => {
    const modal = document.getElementById('yv-sdk-modal');
    const overlay = Array.from(document.body.children).find(
      (el) =>
        el instanceof HTMLElement &&
        el !== modal &&
        el.classList.contains('overlay') &&
        el.classList.contains('animate'),
    ) as HTMLElement | undefined;

    if (!modal || !overlay || host.contains(modal)) return false;

    host.appendChild(overlay);
    host.appendChild(modal);

    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.zIndex = '1';
    overlay.style.backgroundColor = 'hsl(var(--background) / 0.72)';
    overlay.style.backdropFilter = 'blur(2px)';

    modal.style.position = 'absolute';
    modal.style.inset = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.maxHeight = '100%';
    modal.style.zIndex = '2';
    modal.style.borderRadius = 'calc(var(--radius) - 2px)';
    modal.style.overflow = 'hidden';
    modal.style.boxShadow = 'var(--shadow-elegant)';

    const iframe = modal.querySelector('iframe');
    if (iframe instanceof HTMLElement) {
      iframe.style.borderRadius = 'calc(var(--radius) - 2px)';
    }

    const closeBtn = modal.querySelector('.close-button');
    if (closeBtn instanceof HTMLElement) {
      closeBtn.style.backgroundColor = 'hsl(var(--foreground) / 0.55)';
    }

    host.classList.add('youverify-sdk-host--active');
    document.body.classList.add('youverify-sdk-embedded');
    return true;
  };

  const teardown = () => {
    document.body.classList.remove('youverify-sdk-embedded');
    host.classList.remove('youverify-sdk-host--active');
    host.replaceChildren();
  };

  if (applyLayout()) {
    return teardown;
  }

  const observer = new MutationObserver(() => {
    if (applyLayout()) observer.disconnect();
  });

  observer.observe(document.body, { childList: true });

  return () => {
    observer.disconnect();
    teardown();
  };
}
