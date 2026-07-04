import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { ExternalLink, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import { createSubdomainDomain, getCloudflareZones, CloudflareZone } from '@/api/admin/subdomains';
import { SettingsFooter, SettingsSection } from '@/components/admin/settings/settingsLayout';
import { adminBasePath } from '@/routers/adminRoutes';

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const [apiToken, setApiToken] = useState('');
    const [zones, setZones] = useState<CloudflareZone[] | null>(null);
    const [selectedZone, setSelectedZone] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [saving, setSaving] = useState(false);

    const onVerify = (event: React.FormEvent) => {
        event.preventDefault();
        if (!apiToken) return;

        setVerifying(true);
        clearFlashes('admin-subdomains');

        getCloudflareZones(apiToken)
            .then((response) => {
                setZones(response.zones);
                setSelectedZone(response.zones[0]?.id ?? '');
            })
            .catch((error) => {
                setZones(null);
                clearAndAddHttpError({ key: 'admin-subdomains', error });
            })
            .finally(() => setVerifying(false));
    };

    const onConnect = (event: React.FormEvent) => {
        event.preventDefault();
        const zone = zones?.find((entry) => entry.id === selectedZone);
        if (!zone) return;

        setSaving(true);
        clearFlashes('admin-subdomains');

        createSubdomainDomain({
            name: zone.name,
            type: 'cloudflare',
            key: apiToken,
            cloudflare_id: zone.id,
        })
            .then((response: any) => {
                addFlash({
                    key: 'admin-subdomains',
                    type: 'success',
                    title: 'Cloudflare connected',
                    message: `${zone.name} is ready to use.`,
                });
                history.push(`${adminBasePath}/subdomains/${response.domain!.id}`);
            })
            .catch((error) => {
                clearAndAddHttpError({ key: 'admin-subdomains', error });
            })
            .finally(() => setSaving(false));
    };

    return (
        <>
            <FlashMessageRender byKey={'admin-subdomains'} className={'mb-4'} />

            <div className={'space-y-4'}>
            <SettingsSection
                title={'Connect Cloudflare'}
                description={'Create a scoped API token in Cloudflare and paste it here — we’ll fetch your zones automatically.'}
            >
                <div className={'space-y-4 px-5 py-4'}>
                    <div className={'flex items-start gap-3 rounded-md border border-border bg-muted/30 p-4'}>
                        <div className={'flex-1 text-sm text-muted-foreground'}>
                            <p className={'text-foreground font-medium mb-1'}>1. Create a token in Cloudflare</p>
                            <p>
                                Use the <strong>Edit zone DNS</strong> template and scope it to the zone(s) you want to
                                connect.
                            </p>
                        </div>
                        <a
                            href={'https://dash.cloudflare.com/profile/api-tokens'}
                            target={'_blank'}
                            rel={'noreferrer'}
                            className={'no-underline shrink-0'}
                        >
                            <Button type={'button'} variant={'outline'}>
                                <ExternalLink className={'mr-2 h-4 w-4'} />
                                Open Cloudflare
                            </Button>
                        </a>
                    </div>

                    <form onSubmit={onVerify} className={'flex items-end gap-3'}>
                        <div className={'flex-1'}>
                            <label htmlFor={'cf-token'} className={'block text-sm font-medium text-foreground mb-1'}>
                                2. Paste your API token
                            </label>
                            <input
                                id={'cf-token'}
                                type={'password'}
                                value={apiToken}
                                onChange={(e) => {
                                    setApiToken(e.target.value);
                                    setZones(null);
                                }}
                                placeholder={'Cloudflare API token'}
                                className={
                                    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground'
                                }
                            />
                        </div>
                        <Button type={'submit'} disabled={!apiToken || verifying}>
                            {verifying ? 'Verifying…' : 'Verify token'}
                        </Button>
                    </form>

                    {zones && (
                        <div>
                            <label htmlFor={'cf-zone'} className={'block text-sm font-medium text-foreground mb-1'}>
                                3. Choose a zone
                            </label>
                            <select
                                id={'cf-zone'}
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(e.target.value)}
                                className={
                                    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground'
                                }
                            >
                                {zones.map((zone) => (
                                    <option key={zone.id} value={zone.id}>
                                        {zone.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </SettingsSection>

            <SettingsFooter>
                <Link to={`${adminBasePath}/subdomains`} className={'no-underline'}>
                    <Button type={'button'} variant={'outline'}>
                        Cancel
                    </Button>
                </Link>
                <Button type={'button'} onClick={onConnect} disabled={!zones || saving}>
                    <Save className={'mr-2 h-4 w-4'} />
                    {saving ? 'Connecting…' : 'Connect domain'}
                </Button>
            </SettingsFooter>
            </div>
        </>
    );
};
