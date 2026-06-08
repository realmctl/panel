import React, { useContext, useEffect, useState } from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import { Form, Formik, FormikHelpers } from 'formik';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import ModalContext from '@/context/ModalContext';
import asModal from '@/hoc/asModal';
import ScheduleFormFields from '@/components/server/schedules/ScheduleFormFields';

type Props = {
    schedule: Schedule;
};

interface Values {
    name: string;
    dayOfWeek: string;
    month: string;
    dayOfMonth: string;
    hour: string;
    minute: string;
    enabled: boolean;
    onlyWhenOnline: boolean;
}

const EditScheduleModal = ({ schedule }: Props) => {
    const { addError, clearFlashes } = useFlash();
    const { dismiss } = useContext(ModalContext);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const [showCheatsheet, setShowCheatsheet] = useState(false);

    useEffect(
        () => () => {
            clearFlashes('automation:edit');
        },
        [clearFlashes]
    );

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('automation:edit');
        createOrUpdateSchedule(uuid, {
            id: schedule.id,
            name: values.name,
            cron: {
                minute: values.minute,
                hour: values.hour,
                dayOfWeek: values.dayOfWeek,
                month: values.month,
                dayOfMonth: values.dayOfMonth,
            },
            onlyWhenOnline: values.onlyWhenOnline,
            isActive: values.enabled,
        })
            .then((updated) => {
                setSubmitting(false);
                appendSchedule(updated);
                dismiss();
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false);
                addError({ key: 'automation:edit', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    name: schedule.name,
                    minute: schedule.cron.minute,
                    hour: schedule.cron.hour,
                    dayOfMonth: schedule.cron.dayOfMonth,
                    month: schedule.cron.month,
                    dayOfWeek: schedule.cron.dayOfWeek,
                    enabled: schedule.isActive,
                    onlyWhenOnline: schedule.onlyWhenOnline,
                } as Values
            }
        >
            {({ isSubmitting }) => (
                <Form>
                    <h3 css={tw`text-2xl mb-6`}>Edit automation</h3>
                    <FlashMessageRender byKey={'automation:edit'} css={tw`mb-6`} />
                    <ScheduleFormFields
                        showCheatsheet={showCheatsheet}
                        onToggleCheatsheet={() => setShowCheatsheet((value) => !value)}
                    />
                    <div css={tw`mt-6 text-right`}>
                        <Button className={'w-full sm:w-auto'} type={'submit'} disabled={isSubmitting}>
                            Save changes
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default asModal<Props>({ top: false })(EditScheduleModal);
