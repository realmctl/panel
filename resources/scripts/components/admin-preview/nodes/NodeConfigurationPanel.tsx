import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Check, Copy, Key, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { generateNodeDeployToken, getNodeConfiguration } from '@/api/admin/nodes';
import CodeBlock from '@/components/admin-preview/CodeBlock';
import { cn } from '@/lib/utils';

export default () => {
    const { id } = useParams<{ id: string }>();
    const nodeId = Number(id);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data, error, isValidating } = useSWR(
        Number.isFinite(nodeId) ? `admin-node-config-${nodeId}` : null,
        () => getNodeConfiguration(nodeId)
    );
    const [copied, setCopied] = useState(false);
    const [commandCopied, setCommandCopied] = useState(false);
    const [tokenOpen, setTokenOpen] = useState(false);
    const [tokenLoading, setTokenLoading] = useState(false);
    const [deployCommand, setDeployCommand] = useState('');

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-nodes', error });
        } else {
            clearFlashes('admin-nodes');
        }
    }, [error]);

    const onCopy = () => {
        if (!data?.yaml) return;

        navigator.clipboard.writeText(data.yaml).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        });
    };

    const onGenerateToken = () => {
        setTokenLoading(true);
        clearFlashes('admin-nodes');

        generateNodeDeployToken(nodeId)
            .then((response) => {
                const lines = [
                    'cd /etc/realm && sudo wings configure \\',
                    `  --panel-url ${response.panel_url} \\`,
                    `  --token ${response.token} \\`,
                    response.debug ? `  --node ${response.node} \\` : `  --node ${response.node}`,
                ];

                if (response.debug) {
                    lines.push('  --allow-insecure');
                }

                setDeployCommand(lines.join('\n'));
                setCommandCopied(false);
                setTokenOpen(true);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-nodes', error: submitError });
            })
            .finally(() => setTokenLoading(false));
    };

    const onCopyCommand = () => {
        if (!deployCommand) return;

        navigator.clipboard.writeText(deployCommand).then(() => {
            setCommandCopied(true);
            window.setTimeout(() => setCommandCopied(false), 2000);
        });
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load node configuration.</p>;
    }

    return (
        <>
            <Dialog
                appearance="admin"
                panelClassName="max-w-3xl"
                open={tokenOpen}
                onClose={() => setTokenOpen(false)}
                title="Deployment token created"
            >
                <p className="text-sm text-muted-foreground">
                    SSH into the target server as root and run the command below. It writes a fresh{' '}
                    <code className="rounded bg-muted px-1 py-0.5 text-foreground">config.yml</code> using a one-time
                    token, then exits.
                </p>

                <div className="relative mt-4 overflow-hidden rounded-lg border border-border bg-[#0a0e10] shadow-inner">
                    <div className="flex items-center justify-between border-b border-border/60 bg-black/30 px-4 py-2">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                            <Terminal className="h-3.5 w-3.5" />
                            wings configure
                        </div>
                        <button
                            type="button"
                            onClick={onCopyCommand}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/40 px-2.5 py-1 text-xs no-underline transition-colors',
                                commandCopied
                                    ? 'text-emerald-400 hover:text-emerald-300'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {commandCopied ? (
                                <>
                                    <Check className="h-3.5 w-3.5" /> Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3.5 w-3.5" /> Copy
                                </>
                            )}
                        </button>
                    </div>
                    <pre className="max-h-[22rem] overflow-auto px-5 py-4 font-mono text-[13px] leading-6 text-emerald-200 whitespace-pre-wrap break-all">
                        <span className="select-none text-muted-foreground"># run as root on the Wings host{'\n'}</span>
                        <span className="select-none text-muted-foreground">$ </span>
                        {deployCommand}
                    </pre>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        Treat this token like a password. It grants full configuration access to this node and can
                        only be used once. Closing this dialog does not invalidate it — generate a new one if it
                        leaks.
                    </span>
                </div>

                <Dialog.Footer>
                    <Button type="button" variant="outline" onClick={onCopyCommand}>
                        {commandCopied ? (
                            <>
                                <Check className="mr-2 h-4 w-4" /> Copied
                            </>
                        ) : (
                            <>
                                <Copy className="mr-2 h-4 w-4" /> Copy command
                            </>
                        )}
                    </Button>
                    <Button type="button" onClick={() => setTokenOpen(false)}>
                        Done
                    </Button>
                </Dialog.Footer>
            </Dialog>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="overflow-hidden rounded-lg border border-border bg-card">
                        <div className="flex items-center justify-between border-b border-border bg-card px-5 py-3">
                            <h2 className="text-base font-semibold text-foreground">Configuration file</h2>
                            <Button type="button" variant="outline" size="sm" onClick={onCopy}>
                                {copied ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                        <CodeBlock value={data.yaml} language="yaml" embedded />
                        <div className="border-t border-border bg-card px-5 py-3">
                            <p className="text-sm text-muted-foreground">
                                Place this file in your daemon&apos;s root directory (usually{' '}
                                <code className="text-foreground">/etc/realm</code>) as{' '}
                                <code className="text-foreground">config.yml</code>.
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Auto-deploy</h2>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-muted-foreground">
                                Generate a custom deployment command to configure Wings on the target server with a
                                single command.
                            </p>
                        </div>
                        <div className="border-t border-border px-5 py-4">
                            <Button type="button" className="w-full" disabled={tokenLoading} onClick={onGenerateToken}>
                                <Key className="mr-2 h-4 w-4" />
                                {tokenLoading ? 'Generating...' : 'Generate token'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
