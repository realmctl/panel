import React, { useEffect, useRef, useState } from 'react';
import useFlash from '@/plugins/useFlash';
import { createNodeAllocations } from '@/api/admin/nodes';
import { fieldClass, textareaClass } from '@/components/admin/settings/fieldClass';
import { SettingRow } from '@/components/admin/settings/settingsLayout';
import { Button } from '@/components/ui/button';

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
            .then((response: any) => {
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
        <form onSubmit={onSubmit} className="overflow-hidden rounded-md border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">New allocations</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Assign IP addresses and ports to this node.</p>
            </div>

            <div className="divide-y divide-border">
                {ips.length > 0 && (
                    <SettingRow label="Known IPs" description="IPs already used on this node." stacked>
                        <p className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
                            {ips.map((ip) => (
                                <code key={ip} className="text-foreground">
                                    {ip}
                                </code>
                            ))}
                        </p>
                    </SettingRow>
                )}
                <SettingRow
                    label="IP address"
                    description="An IP address or CIDR block."
                    htmlFor="allocation-ip"
                    stacked
                >
                    <input
                        id="allocation-ip"
                        list={ips.length > 0 ? 'allocation-ip-options' : undefined}
                        className={fieldClass}
                        value={form.allocation_ip}
                        onChange={(event) => {
                            setForm((current) => ({ ...current, allocation_ip: event.target.value }));
                        }}
                        placeholder="192.168.1.1"
                        required
                    />
                    {ips.length > 0 && (
                        <datalist id="allocation-ip-options">
                            {ips.map((ip) => (
                                <option key={ip} value={ip} />
                            ))}
                        </datalist>
                    )}
                </SettingRow>
                <SettingRow label="IP alias" description="Optional default alias." htmlFor="allocation-alias" stacked>
                    <input
                        id="allocation-alias"
                        className={fieldClass}
                        value={form.allocation_alias}
                        onChange={(event) => {
                            setForm((current) => ({ ...current, allocation_alias: event.target.value }));
                        }}
                        placeholder="alias"
                    />
                </SettingRow>
                <SettingRow
                    label="Ports"
                    description="Individual ports or ranges, comma or space separated."
                    htmlFor="allocation-ports"
                    stacked
                >
                    <textarea
                        id="allocation-ports"
                        className={textareaClass}
                        value={form.allocation_ports}
                        onChange={(event) => {
                            setForm((current) => ({ ...current, allocation_ports: event.target.value }));
                        }}
                        placeholder="25565, 25566, 3000-3100"
                        rows={4}
                        required
                    />
                </SettingRow>
            </div>

            <div className="border-t border-border px-5 py-4">
                <Button type="submit" className="w-full" disabled={creating}>
                    {creating ? 'Submitting...' : 'Create allocations'}
                </Button>
            </div>
        </form>
    );
};
