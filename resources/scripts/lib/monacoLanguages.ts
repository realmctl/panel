import modes, { Mode } from '@/modes';

const MIME_TO_MONACO: Record<string, string> = {
    'text/plain': 'plaintext',
    'text/x-properties': 'ini',
    'text/x-yaml': 'yaml',
    'text/yaml': 'yaml',
    'application/json': 'json',
    'application/x-json': 'json',
    'text/javascript': 'javascript',
    'text/ecmascript': 'javascript',
    'application/javascript': 'javascript',
    'application/x-javascript': 'javascript',
    'application/ecmascript': 'javascript',
    'application/typescript': 'typescript',
    'text/css': 'css',
    'text/html': 'html',
    'text/x-markdown': 'markdown',
    'text/x-gfm': 'markdown',
    'text/x-python': 'python',
    'text/x-php': 'php',
    'application/x-httpd-php': 'php',
    'application/x-httpd-php-open': 'php',
    'text/x-ruby': 'ruby',
    'text/x-rustsrc': 'rust',
    'text/x-go': 'go',
    'text/x-sh': 'shell',
    'application/x-sh': 'shell',
    'text/x-sql': 'sql',
    'text/x-mysql': 'sql',
    'text/x-pgsql': 'sql',
    'text/x-mariadb': 'sql',
    'text/x-mssql': 'sql',
    'text/x-sqlite': 'sql',
    'text/x-cassandra': 'sql',
    'text/x-lua': 'lua',
    'text/x-dockerfile': 'dockerfile',
    'text/x-nginx-conf': 'nginx',
    'application/xml': 'xml',
    'text/xml': 'xml',
    'text/x-csrc': 'c',
    'text/x-c++src': 'cpp',
    'text/x-csharp': 'csharp',
    'text/x-scss': 'scss',
    'text/x-sass': 'scss',
    'text/x-toml': 'plaintext',
    'text/x-diff': 'plaintext',
    'message/http': 'plaintext',
    'text/x-pug': 'plaintext',
    'text/x-jade': 'plaintext',
    'script/x-vue': 'html',
    'text/x-vue': 'html',
};

export const findModeByFilename = (filename: string): Mode | undefined => {
    for (let i = 0; i < modes.length; i++) {
        const info = modes[i];

        if (info.file && info.file.test(filename)) {
            return info;
        }
    }

    const dot = filename.lastIndexOf('.');
    const ext = dot > -1 && filename.substring(dot + 1, filename.length);

    if (ext) {
        for (let i = 0; i < modes.length; i++) {
            const info = modes[i];
            if (info.ext) {
                for (let j = 0; j < info.ext.length; j++) {
                    if (info.ext[j] === ext) {
                        return info;
                    }
                }
            }
        }
    }

    return undefined;
};

export const mimeToMonacoLanguage = (mime: string): string => MIME_TO_MONACO[mime] || 'plaintext';

export const getMonacoLanguage = (filename?: string, mime?: string): string => {
    if (filename) {
        const mode = findModeByFilename(filename);
        if (mode) {
            return mimeToMonacoLanguage(mode.mime);
        }
    }

    if (mime) {
        return mimeToMonacoLanguage(mime);
    }

    return 'plaintext';
};
