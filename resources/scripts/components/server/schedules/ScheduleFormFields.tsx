import React from 'react';
import Field from '@/components/elements/Field';
import FormikSwitch from '@/components/elements/FormikSwitch';
import Switch from '@/components/elements/Switch';
import ScheduleCheatsheetCards from '@/components/server/schedules/ScheduleCheatsheetCards';
import tw from 'twin.macro';

interface Props {
    showCheatsheet: boolean;
    onToggleCheatsheet: () => void;
}

export default ({ showCheatsheet, onToggleCheatsheet }: Props) => (
    <>
        <Field
            name={'name'}
            label={'Automation name'}
            description={'A human readable identifier for this automation.'}
        />
        <div css={tw`grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6`}>
            <Field name={'minute'} label={'Minute'} />
            <Field name={'hour'} label={'Hour'} />
            <Field name={'dayOfMonth'} label={'Day of month'} />
            <Field name={'month'} label={'Month'} />
            <Field name={'dayOfWeek'} label={'Day of week'} />
        </div>
        <p css={tw`text-neutral-400 text-xs mt-2`}>
            Automations support Cronjob syntax for defining when tasks should run. Use the fields above to specify when
            these tasks should begin running.
        </p>
        <div css={tw`mt-6 bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
            <Switch
                name={'show_cheatsheet'}
                description={'Show the cron cheatsheet for some examples.'}
                label={'Show Cheatsheet'}
                defaultChecked={showCheatsheet}
                onChange={onToggleCheatsheet}
            />
            {showCheatsheet && (
                <div css={tw`block md:flex w-full`}>
                    <ScheduleCheatsheetCards />
                </div>
            )}
        </div>
        <div css={tw`mt-6 bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
            <FormikSwitch
                name={'onlyWhenOnline'}
                description={'Only execute this automation when the server is in a running state.'}
                label={'Only When Server Is Online'}
            />
        </div>
        <div css={tw`mt-6 bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
            <FormikSwitch
                name={'enabled'}
                description={'This automation will be executed automatically if enabled.'}
                label={'Automation enabled'}
            />
        </div>
    </>
);
