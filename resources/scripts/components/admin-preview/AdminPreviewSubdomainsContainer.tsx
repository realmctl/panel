import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import SubdomainTabNav from '@/components/admin-preview/subdomains/SubdomainTabNav';
import DomainListPanel from '@/components/admin-preview/subdomains/DomainListPanel';
import DomainCreatePanel from '@/components/admin-preview/subdomains/DomainCreatePanel';
import DomainEditPanel from '@/components/admin-preview/subdomains/DomainEditPanel';
import RecordListPanel from '@/components/admin-preview/subdomains/RecordListPanel';
import RecordCreatePanel from '@/components/admin-preview/subdomains/RecordCreatePanel';
import RecordEditPanel from '@/components/admin-preview/subdomains/RecordEditPanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminPreviewContent
            title={'Subdomain Manager'}
            description={'Configure DNS domains and record templates for customer subdomains.'}
        >
            <FlashMessageRender byKey={'admin-subdomains'} className={'mb-4'} />

            <SubdomainTabNav />

            <Switch>
                <Route path={`${match.path}/records/new`}>
                    <RecordCreatePanel />
                </Route>
                <Route path={`${match.path}/records/:id`}>
                    <RecordEditPanel />
                </Route>
                <Route path={`${match.path}/records`} exact>
                    <RecordListPanel />
                </Route>
                <Route path={`${match.path}/new`}>
                    <DomainCreatePanel />
                </Route>
                <Route path={`${match.path}/:id`}>
                    <DomainEditPanel />
                </Route>
                <Route path={match.path} exact>
                    <DomainListPanel />
                </Route>
            </Switch>
        </AdminPreviewContent>
    );
};
