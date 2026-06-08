import React, { useEffect, useRef, useState } from 'react';
import getServerSchedules from '@/api/server/schedules/getServerSchedules';
import { ServerContext } from '@/state/server';
import Spinner from '@/components/elements/Spinner';
import { useHistory, useRouteMatch } from 'react-router-dom';
import FlashMessageRender from '@/components/FlashMessageRender';
import ScheduleRow from '@/components/server/schedules/ScheduleRow';
import { httpErrorToHuman } from '@/api/http';
import CreateScheduleDrawer from '@/components/server/schedules/CreateScheduleDrawer';
import AutomationTemplatesDrawer from '@/components/server/schedules/AutomationTemplatesDrawer';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import { Button } from '@/components/elements/button/index';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import bulkUpdateSchedules from '@/api/server/schedules/bulkUpdateSchedules';
import importSchedule from '@/api/server/schedules/importSchedule';
import { AUTOMATION_TEMPLATES } from '@/components/server/schedules/automationTemplates';
import Switch from '@/components/elements/Switch';

export default () => {
    const match = useRouteMatch();
    const history = useHistory();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, addError, addFlash } = useFlash();
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);
    const [templatesVisible, setTemplatesVisible] = useState(false);
    const [bulkMode, setBulkMode] = useState(false);
    const [selected, setSelected] = useState<Set<number>>(new Set());

    const schedules = ServerContext.useStoreState((state) => state.schedules.data);
    const setSchedules = ServerContext.useStoreActions((actions) => actions.schedules.setSchedules);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    useEffect(() => {
        clearFlashes('automation');
        getServerSchedules(uuid)
            .then((schedules) => setSchedules(schedules))
            .catch((error) => {
                addError({ message: httpErrorToHuman(error), key: 'automation' });
                console.error(error);
            })
            .then(() => setLoading(false));
    }, []);

    const toggleSelected = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const bulkSetActive = (isActive: boolean) => {
        bulkUpdateSchedules(uuid, Array.from(selected), isActive)
            .then(() => {
                setSchedules(schedules.map((s) => (selected.has(s.id) ? { ...s, isActive, isProcessing: false } : s)));
                setSelected(new Set());
                setBulkMode(false);
                addFlash({
                    type: 'success',
                    key: 'automation',
                    message: `Selected automations ${isActive ? 'enabled' : 'disabled'}.`,
                });
            })
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'automation' }));
    };

    const onImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const template = JSON.parse(reader.result as string);
                importSchedule(uuid, template)
                    .then((schedule) => {
                        appendSchedule(schedule);
                        history.push(`${match.url}/${schedule.id}`);
                    })
                    .catch((error) => addError({ message: httpErrorToHuman(error), key: 'automation' }));
            } catch {
                addError({ message: 'Invalid automation template file.', key: 'automation' });
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const onTemplateSelect = (index: number) => {
        importSchedule(uuid, AUTOMATION_TEMPLATES[index].template)
            .then((schedule) => {
                appendSchedule(schedule);
                history.push(`${match.url}/${schedule.id}`);
            })
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'automation' }));
    };

    return (
        <ServerContentBlock title={'Automation'}>
            <FlashMessageRender byKey={'automation'} css={tw`mb-4`} />
            {!schedules.length && loading ? (
                <Spinner size={'large'} centered />
            ) : (
                <>
                    {schedules.length === 0 ? (
                        <div className={'flex flex-col items-center justify-center py-16'}>
                            <h3 className={'text-lg font-semibold text-neutral-100 mb-1'}>No automations yet</h3>
                            <p className={'text-sm text-neutral-400 text-center max-w-sm'}>
                                Automations let you run restarts, backups, webhooks, and commands at specific times.
                            </p>
                            <Can action={'schedule.create'}>
                                <div className={'mt-6 flex gap-3'}>
                                    <CreateScheduleDrawer visible={visible} onDismissed={() => setVisible(false)} />
                                    <AutomationTemplatesDrawer
                                        visible={templatesVisible}
                                        onDismissed={() => setTemplatesVisible(false)}
                                        onSelect={onTemplateSelect}
                                    />
                                    <Button type={'button'} onClick={() => setVisible(true)}>
                                        Create automation
                                    </Button>
                                    <Button type={'button'} variant={Button.Variants.Secondary} onClick={() => setTemplatesVisible(true)}>
                                        Use template
                                    </Button>
                                </div>
                            </Can>
                        </div>
                    ) : (
                        <>
                            <Can action={'schedule.update'}>
                                <div css={tw`flex items-center justify-between mb-4`}>
                                    <Switch
                                        name={'bulk_mode'}
                                        label={'Bulk select'}
                                        defaultChecked={bulkMode}
                                        onChange={() => {
                                            setBulkMode((v) => !v);
                                            setSelected(new Set());
                                        }}
                                    />
                                    {bulkMode && selected.size > 0 && (
                                        <div css={tw`flex gap-2`}>
                                            <Button.Text onClick={() => bulkSetActive(true)}>Enable selected</Button.Text>
                                            <Button.Text onClick={() => bulkSetActive(false)}>Disable selected</Button.Text>
                                        </div>
                                    )}
                                </div>
                            </Can>
                            {schedules.map((schedule) => (
                                <GreyRowBox
                                    as={'a'}
                                    key={schedule.id}
                                    href={`${match.url}/${schedule.id}`}
                                    css={tw`cursor-pointer mb-2 flex-wrap`}
                                    onClick={(e: any) => {
                                        if (bulkMode) {
                                            e.preventDefault();
                                            toggleSelected(schedule.id);
                                            return;
                                        }
                                        e.preventDefault();
                                        history.push(`${match.url}/${schedule.id}`);
                                    }}
                                >
                                    {bulkMode && (
                                        <input
                                            type={'checkbox'}
                                            checked={selected.has(schedule.id)}
                                            readOnly
                                            css={tw`mr-3`}
                                        />
                                    )}
                                    <ScheduleRow schedule={schedule} />
                                </GreyRowBox>
                            ))}
                        </>
                    )}
                    <Can action={'schedule.create'}>
                        {schedules.length > 0 && (
                            <div css={tw`mt-8 flex justify-end gap-3 flex-wrap`}>
                                <input ref={fileInputRef} type={'file'} accept={'.json'} css={tw`hidden`} onChange={onImportFile} />
                                <CreateScheduleDrawer visible={visible} onDismissed={() => setVisible(false)} />
                                <AutomationTemplatesDrawer
                                    visible={templatesVisible}
                                    onDismissed={() => setTemplatesVisible(false)}
                                    onSelect={onTemplateSelect}
                                />
                                <Button type={'button'} variant={Button.Variants.Secondary} onClick={() => fileInputRef.current?.click()}>
                                    Import JSON
                                </Button>
                                <Button type={'button'} variant={Button.Variants.Secondary} onClick={() => setTemplatesVisible(true)}>
                                    Use template
                                </Button>
                                <Button type={'button'} onClick={() => setVisible(true)}>
                                    Create automation
                                </Button>
                            </div>
                        )}
                    </Can>
                </>
            )}
        </ServerContentBlock>
    );
};
