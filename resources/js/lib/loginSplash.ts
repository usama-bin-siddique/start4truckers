type Listener = () => void;

const SPLASH_MS = 1000;

let active = false;
let startedAt = 0;
let finishTimer: number | null = null;
const listeners = new Set<Listener>();

function notify() {
    listeners.forEach((listener) => listener());
}

function clearFinishTimer() {
    if (finishTimer !== null) {
        window.clearTimeout(finishTimer);
        finishTimer = null;
    }
}

export function beginLoginSplash() {
    clearFinishTimer();
    active = true;
    startedAt = Date.now();
    document.documentElement.classList.add('login-splash-active');
    notify();
}

export function cancelLoginSplash() {
    clearFinishTimer();
    active = false;
    startedAt = 0;
    document.documentElement.classList.remove('login-splash-active');
    notify();
}

export function finishLoginSplash() {
    if (!active || finishTimer !== null) {
        return;
    }

    const remaining = Math.max(0, SPLASH_MS - (Date.now() - startedAt));

    finishTimer = window.setTimeout(() => {
        finishTimer = null;
        active = false;
        startedAt = 0;
        document.documentElement.classList.remove('login-splash-active');
        notify();
    }, remaining);
}

export function isLoginSplashActive() {
    return active;
}

export function subscribeLoginSplash(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
