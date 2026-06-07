import React, { useEffect, useRef, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import useFlash from '@/plugins/useFlash';
import { createNodeAllocations } from '@/api/admin/nodes';
import { fieldClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';

const parsePorts = (value: string): string[] => value.split(/[\s,]+/).filter(Boolean);

interface Props {
    nodeId: number;
    ips: string[];
    onCreated: () => void;
}

export default ({ nodeId, ips, onCreated }: Props) => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const ipInitialized = useRef(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        allocation_ip: '',
        allocation_alias: '',
        allocation_ports: '',
    });

    useEffect(() => {
        if (ipInitialized.current || ips.length === 0) {
            return;
        }

        setForm((current) => ({ ...current, allocation_ip: ips[0] }));
        ipInitialized.current = true;
    }, [ips]);

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const ports = parsePorts(form.allocation_ports);
        if (!form.allocation_ip.trim() || ports.length === 0) {
            return;
        }

        setCreating(true);
        clearFlashes('admin-nodes');

        createNodeAllocations(nodeId, {
            allocation_ip: form.allocation_ip.trim(),
            allocation_alias: form.allocation_alias.trim() || undefined,
            allocation_ports: ports,
        })
            .then((response) => {
                addFlash({
                    key: 'admin-nodes',
                    type: 'success',
                    title: 'Allocations created',
                    message: response.message,
                });
                setForm((current) => ({ ...current, allocation_ports: '', allocation_alias: '' }));
                onCreated();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-nodes', error: submitError });
            })
            .finally(() => setCreating(false));
    };

    return (
        <form onSubmit={onSubmit} className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">Assign new allocations</h2>
            </div>
            <div className="space-y-5 p-5">
                <div className="space-y-2">
                    <Label htmlFor="allocation-ip">IP address</Label>
                    <input
                        id="allocation-ip"
                        list="allocation-ip-options"
                        className={fieldClass}
                        value={form.allocation_ip}
                        onChange={(event) => {
                            const value = event.target.value;
                            setForm((current) => ({ ...current, allocation_ip: value }));
                        }}
                        placeholder="192.168.1.1"
                        required
                    />
                    <datalist id="allocation-ip-options">
                        {ips.map((ip) => (
                            <option key={ip} value={ip} />
                        ))}
                    </datalist>
                    <p className="text-xs text-muted-foreground">
                        Enter an IP address or CIDR block to assign ports to.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="allocation-alias">IP alias</Label>
                    <input
                        id="allocation-alias"
                        className={fieldClass}
                        value={form.allocation_alias}
                        onChange={(event) => {
                            const value = event.target.value;
                            setForm((current) => ({ ...current, allocation_alias: value }));
                        }}
                        placeholder="alias"
                    />
                    <p className="text-xs text-muted-foreground">Optional default alias for these allocations.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="allocation-ports">Ports</Label>
                    <textarea
                        id="allocation-ports"
                        className={textareaClass}
                        value={form.allocation_ports}
                        onChange={(event) => {
                            const value = event.target.value;
                            setForm((current) => ({ ...current, allocation_ports: value }));
                        }}
                        placeholder="25565, 25566, 3000-3100"
                        rows={4}
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Individual ports or ranges, separated by commas or spaces.
                    </p>
                </div>
            </div>
            <div className="flex justify-end border-t border-border px-5 py-4">
                <Button type="submit" disabled={creating}>
                    <Save className="mr-2 h-4 w-4" />
                    {creating ? 'Submitting...' : 'Submit'}
                </Button>
            </div>
        </form>
    );
};
