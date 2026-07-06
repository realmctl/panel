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
import { Button } from '@/components/elements/button/index';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import bulkUpdateSchedules from '@/api/server/schedules/bulkUpdateSchedules';
import importSchedule from '@/api/server/schedules/importSchedule';
import { AUTOMATION_TEMPLATES } from '@/components/server/schedules/automationTemplates';
import BulkModeSelect from '@/components/server/schedules/BulkModeSelect';

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
            <FlashMessageRender byKey={'automation'} className={'mb-4'} />

            <CreateScheduleDrawer visible={visible} onDismissed={() => setVisible(false)} />
            <AutomationTemplatesDrawer
                visible={templatesVisible}
                onDismissed={() => setTemplatesVisible(false)}
                onSelect={onTemplateSelect}
            />
            <input ref={fileInputRef} type={'file'} accept={'.json'} className={'hidden'} onChange={onImportFile} />

            {!schedules.length && loading ? (
                <Spinner size={'large'} centered />
            ) : schedules.length === 0 ? (
                <div className={'flex flex-col items-center justify-center py-16'}>
                    <h3 className={'text-lg font-semibold text-neutral-100 mb-1'}>No automations yet</h3>
                    <p className={'text-sm text-neutral-400 text-center max-w-sm'}>
                        Automations let you run restarts, backups, webhooks, and commands at specific times.
                    </p>
                    <Can action={'schedule.create'}>
                        <div className={'mt-6 flex gap-3'}>
                            <Button type={'button'} onClick={() => setVisible(true)}>
                                Create automation
                            </Button>
                            <Button
                                type={'button'}
                                variant={Button.Variants.Secondary}
                                onClick={() => setTemplatesVisible(true)}
                            >
                                Use template
                            </Button>
                        </div>
                    </Can>
                </div>
            ) : (
                <>
                    <div className={'rounded-md border border-realm-border/50 bg-realm-card overflow-hidden'}>
                        <div className={'hidden sm:grid grid-cols-12 gap-4 px-4 py-2 border-b border-realm-border/50'}>
                            <div className={'col-span-5 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                Name
                            </div>
                            <div className={'col-span-4 text-xs font-medium uppercase tracking-wide text-neutral-500'}>
                                Cron
                            </div>
                            <div className={'col-span-3 text-xs font-medium uppercase tracking-wide text-neutral-500 text-right'}>
                                Status
                            </div>
                        </div>
                        <div className={'divide-y divide-realm-border/50'}>
                            {schedules.map((schedule) => (
                                <ScheduleRow
                                    key={schedule.id}
                                    schedule={schedule}
                                    bulkMode={bulkMode}
                                    selected={selected.has(schedule.id)}
                                    onToggleSelected={toggleSelected}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={'flex items-center justify-between gap-4 mt-4'}>
                        <Can action={'schedule.create'}>
                            <p className={'text-sm text-neutral-500 m-0'}>
                                {schedules.length} automation{schedules.length === 1 ? '' : 's'} configured.{' '}
                                <button
                                    type={'button'}
                                    onClick={() => setVisible(true)}
                                    className={'bg-transparent border-0 p-0 text-blue-600 hover:text-blue-500 cursor-pointer'}
                                >
                                    Create a new automation
                                </button>
                                {', '}
                                <button
                                    type={'button'}
                                    onClick={() => setTemplatesVisible(true)}
                                    className={'bg-transparent border-0 p-0 text-blue-600 hover:text-blue-500 cursor-pointer'}
                                >
                                    use a template
                                </button>
                                {', or '}
                                <button
                                    type={'button'}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={'bg-transparent border-0 p-0 text-blue-600 hover:text-blue-500 cursor-pointer'}
                                >
                                    import one from JSON
                                </button>
                                .
                            </p>
                        </Can>

                        <Can action={'schedule.update'}>
                            <div className={'flex items-center gap-3 flex-shrink-0'}>
                                {bulkMode && selected.size > 0 && (
                                    <div className={'flex gap-2'}>
                                        <Button.Text size={Button.Sizes.Small} onClick={() => bulkSetActive(true)}>
                                            Enable selected
                                        </Button.Text>
                                        <Button.Text size={Button.Sizes.Small} onClick={() => bulkSetActive(false)}>
                                            Disable selected
                                        </Button.Text>
                                    </div>
                                )}
                                <BulkModeSelect
                                    value={bulkMode}
                                    onChange={(value) => {
                                        setBulkMode(value);
                                        setSelected(new Set());
                                    }}
                                />
                            </div>
                        </Can>
                    </div>
                </>
            )}
        </ServerContentBlock>
    );
};
