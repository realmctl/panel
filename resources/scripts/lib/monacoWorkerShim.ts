/**
 * monaco-editor-webpack-plugin detects cross-origin worker URLs with a naive
 * string prefix comparison that ignores port boundaries, so e.g.
 * "https://realm.test" is treated as matching "https://realm.test:5173/..."
 * (the dev server origin under `beak serve`). That skips its blob-wrap
 * fallback and `new Worker(...)` then throws a SecurityError. Re-derive the
 * worker URL correctly using the URL API and wrap it ourselves when needed.
 */
export const patchMonacoWorkerEnvironment = () => {
    if (typeof window === 'undefined') {
        return;
    }

    const env = window.MonacoEnvironment as
        | { getWorker?: (moduleId: string, label: string) => Worker; getWorkerUrl?: (moduleId: string, label: string) => string }
        | undefined;

    if (!env || env.getWorker || typeof env.getWorkerUrl !== 'function') {
        return;
    }

    const originalGetWorkerUrl = env.getWorkerUrl.bind(env);

    env.getWorker = (moduleId: string, label: string) => {
        const rawUrl = originalGetWorkerUrl(moduleId, label);

        if (rawUrl.startsWith('blob:')) {
            return new Worker(rawUrl, { name: label, type: 'module' });
        }

        let isCrossOrigin = false;
        try {
            isCrossOrigin = new URL(rawUrl, window.location.href).origin !== window.location.origin;
        } catch {
            isCrossOrigin = false;
        }

        if (!isCrossOrigin) {
            return new Worker(rawUrl, { name: label, type: 'module' });
        }

        const blob = new Blob([`import ${JSON.stringify(rawUrl)};`], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        return new Worker(blobUrl, { name: label, type: 'module' });
    };
};
