import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { Check, Copy, Key } from 'lucide-react';
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
                const insecure = response.debug ? ' --allow-insecure' : '';
                setDeployCommand(
                    `cd /etc/realm && sudo wings configure --panel-url ${response.panel_url} --token ${response.token} --node ${response.node}${insecure}`
                );
                setTokenOpen(true);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-nodes', error: submitError });
            })
            .finally(() => setTokenLoading(false));
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
                panelClassName="max-w-2xl"
                open={tokenOpen}
                onClose={() => setTokenOpen(false)}
                title="Deployment token created"
            >
                <p className="text-sm text-muted-foreground">
                    To auto-configure your node, run the following command on the target server:
                </p>
                <CodeBlock value={deployCommand} language="plaintext" className="mt-4" maxHeight="12rem" />
                <Dialog.Footer>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            navigator.clipboard.writeText(deployCommand);
                        }}
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy command
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
