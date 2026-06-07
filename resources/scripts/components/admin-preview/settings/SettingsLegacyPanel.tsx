import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsTab } from '@/components/admin-preview/settings/settingsTabs';

export default ({ tab }: { tab: SettingsTab }) => (
    <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">{tab.label}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tab.description}</p>
        <p className="mt-4 text-sm text-muted-foreground">
            This section has not been migrated to the new admin interface yet.
        </p>
        <a href={tab.legacyPath} className="mt-5 inline-block no-underline">
            <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in legacy admin
            </Button>
        </a>
    </div>
);
