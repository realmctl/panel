import React, { useState } from 'react';
import { Allocation } from '@/api/server/getServer';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button/index';
import { ip } from '@/lib/formatters';
import AllocationFirewallModal from '@/components/server/network/AllocationFirewallModal';

interface Props {
    allocation: Allocation;
    onCreateAllocation: () => void;
    canCreateAllocation: boolean;
}

export default ({ allocation, onCreateAllocation, canCreateAllocation }: Props) => {
    const [showFirewall, setShowFirewall] = useState(false);
    const address = `${allocation.alias ?? ip(allocation.ip)}:${allocation.port}`;

    return (
        <>
            <AllocationFirewallModal
                visible={showFirewall}
                allocation={allocation}
                onDismissed={() => setShowFirewall(false)}
            />

            <div className={'flex flex-col items-center justify-center py-16'}>
                <h3 className={'text-lg font-semibold text-neutral-100 mb-1'}>One network port</h3>
                <p className={'text-sm text-neutral-400 text-center max-w-sm'}>
                    Players can connect at{' '}
                    <CopyOnClick text={address}>
                        <button
                            type={'button'}
                            className={
                                'font-mono text-neutral-200 hover:text-blue-400 border-0 bg-transparent p-0 cursor-pointer underline decoration-neutral-600 underline-offset-2 transition-colors duration-150'
                            }
                        >
                            {address}
                        </button>
                    </CopyOnClick>
                    . Add more ports for proxies, voice chat, or other services.
                </p>

                <div className={'mt-6 flex gap-3'}>
                    {canCreateAllocation && (
                        <Can action={'allocation.create'}>
                            <Button type={'button'} onClick={onCreateAllocation}>
                                Add Allocation
                            </Button>
                        </Can>
                    )}
                    <Can action={'allocation.update'}>
                        <Button type={'button'} onClick={() => setShowFirewall(true)}>
                            Firewall
                        </Button>
                    </Can>
                </div>
            </div>
        </>
    );
};
