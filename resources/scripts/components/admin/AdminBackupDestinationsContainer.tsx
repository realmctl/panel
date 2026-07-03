import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminContent from '@/components/admin/AdminContent';
import BackupDestinationListPanel from '@/components/admin/backupDestinations/BackupDestinationListPanel';
import BackupDestinationViewPanel from '@/components/admin/backupDestinations/BackupDestinationViewPanel';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => {
    const match = useRouteMatch();

    return (
        <AdminContent
            title={'Backup Destinations'}
            description={'Configure S3 destinations and assign them to locations, e.g. one bucket for NA and another for EU.'}
        >
            <FlashMessageRender byKey={'admin-backup-destinations'} className={'mb-4'} />

            <Switch>
                <Route path={`${match.path}/new`}>
                    <Redirect to={match.path} />
                </Route>
                <Route path={`${match.path}/:id`}>
                    <BackupDestinationViewPanel />
                </Route>
                <Route path={match.path} exact>
                    <BackupDestinationListPanel />
                </Route>
            </Switch>
        </AdminContent>
    );
};
