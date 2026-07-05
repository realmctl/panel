import React from 'react';
import classNames from 'classnames';
import Modal from '@/components/elements/Modal';
import { Button } from '@/components/elements/button/index';
import { AUTOMATION_TEMPLATES } from '@/components/server/schedules/automationTemplates';
import { realmClasses } from '@/lib/realmTokens';

interface Props {
    visible: boolean;
    onDismissed: () => void;
    onSelect: (index: number) => void;
}

const AutomationTemplatesDrawer = ({ visible, onDismissed, onSelect }: Props) => {
    return (
        <Modal
            visible={visible}
            onDismissed={onDismissed}
            title={'Automation templates'}
            footer={
                <Button.Text size={Button.Sizes.Small} onClick={onDismissed}>
                    Cancel
                </Button.Text>
            }
        >
            <p className={'text-sm text-neutral-400 mb-4 -mt-3'}>Start from a preset and customize it after creation.</p>
            <div className={'space-y-3'}>
                {AUTOMATION_TEMPLATES.map((item, index) => (
                    <button
                        key={item.label}
                        type={'button'}
                        className={classNames(
                            'w-full text-left p-4 rounded-lg border transition-colors duration-150 cursor-pointer',
                            realmClasses.insetPanel,
                            'hover:border-neutral-500'
                        )}
                        onClick={() => {
                            onSelect(index);
                            onDismissed();
                        }}
                    >
                        <p className={'text-neutral-100 font-medium m-0'}>{item.label}</p>
                        <p className={'text-neutral-400 text-sm mt-1 mb-0'}>{item.description}</p>
                    </button>
                ))}
            </div>
        </Modal>
    );
};

export default AutomationTemplatesDrawer;
