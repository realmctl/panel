import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { generateNodeDeployToken, getNodeConfiguration } from '@/api/admin/nodes';
import CodeBlock from '@/components/admin-preview/CodeBlock';

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
            .then((response: any) => {
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
                title="Deployment command"
            >
                <p className="text-sm text-muted-foreground">
                    SSH into the Wings host as root and run this command. It writes{' '}
                    <code className="text-foreground">/etc/realm/config.yml</code> using a one-time token.
                </p>

                {deployCommand && (
                    <div className="mt-4 overflow-hidden rounded-md border border-border">
                        <CodeBlock
                            value={`# run as root on the Wings host\n${deployCommand}`}
                            language="plaintext"
                            embedded
                            maxHeight="22rem"
                        />
                    </div>
                )}

                <p className="mt-4 text-xs text-muted-foreground">
                    Treat this token like a password — single use only. Closing this dialog does not invalidate it.
                </p>

                <Dialog.Footer>
                    <Button type="button" variant="outline" onClick={onCopyCommand}>
                        {commandCopied ? 'Copied' : 'Copy command'}
                    </Button>
                    <Button type="button" onClick={() => setTokenOpen(false)}>
                        Done
                    </Button>
                </Dialog.Footer>
            </Dialog>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
                <div className="lg:col-span-2">
                    <div className="overflow-hidden rounded-md border border-border bg-card">
                        <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">config.yml</h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Save as <code className="text-foreground">/etc/realm/config.yml</code> on the
                                    daemon host. Restart Wings after manual changes.
                                </p>
                            </div>
                            <Button type="button" variant="outline" className="shrink-0" onClick={onCopy}>
                                {copied ? 'Copied' : 'Copy'}
                            </Button>
                        </div>
                        <CodeBlock value={data.yaml} language="yaml" embedded />
                    </div>
                </div>

                <div className="overflow-hidden rounded-md border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Auto-deploy</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Configure Wings on a new host with one command.
                        </p>
                    </div>
                    <div className="space-y-4 px-5 py-4 text-sm text-muted-foreground">
                        <p>
                            Generates a one-time token and <code className="text-foreground">wings configure</code>{' '}
                            command. Run it as root on the target server.
                        </p>
                        <ol className="list-decimal space-y-1.5 pl-4">
                            <li>Generate a deployment token</li>
                            <li>SSH into the Wings host as root</li>
                            <li>Paste and run the command</li>
                            <li>Start or restart Wings</li>
                        </ol>
                    </div>
                    <div className="border-t border-border px-5 py-4">
                        <Button type="button" className="w-full" disabled={tokenLoading} onClick={onGenerateToken}>
                            {tokenLoading ? 'Generating...' : 'Generate token'}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};
