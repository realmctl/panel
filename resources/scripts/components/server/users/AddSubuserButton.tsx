import React, { useState } from 'react';
import InviteSubuserDrawer from '@/components/server/users/InviteSubuserDrawer';
import { Button } from '@/components/elements/button/index';

export default () => {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <InviteSubuserDrawer visible={visible} onDismissed={() => setVisible(false)} />
            <Button onClick={() => setVisible(true)}>Invite user</Button>
        </>
    );
};
