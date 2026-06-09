import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminContent from '@/components/admin/AdminContent';
import SubdomainTabNav from '@/components/admin/subdomains/SubdomainTabNav';
import DomainListPanel from '@/components/admin/subdomains/DomainListPanel';
import DomainCreatePanel from '@/components/admin/subdomains/DomainCreatePanel';
import DomainEditPanel from '@/components/admin/subdomains/DomainEditPanel';
import RecordListPanel from '@/components/admin/subdomains/RecordListPanel';
import RecordCreatePanel from '@/components/admin/subdomains/RecordCreatePanel';
import RecordEditPanel from '@/components/admin/subdomains/RecordEditPanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminContent
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
        </AdminContent>
    );
};
