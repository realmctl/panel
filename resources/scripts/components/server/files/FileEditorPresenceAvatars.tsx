import React from 'react';
import classNames from 'classnames';
import Avatar from '@/components/Avatar';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import { FileEditorPresence } from '@/api/server/files/fileEditingPresence';
import styles from './style.module.css';

interface Props {
    editors: FileEditorPresence[];
    currentUserUuid?: string;
    maxVisible?: number;
    size?: number;
    className?: string;
}

const buildTooltip = (editor: FileEditorPresence, isSelf: boolean) => (
    <div className={'flex flex-col gap-0.5 text-left'}>
        <span className={'font-medium text-neutral-100'}>{isSelf ? 'You' : editor.username}</span>
        <span className={'text-neutral-400 text-xs'}>Line {editor.line}</span>
    </div>
);

const buildOverflowTooltip = (editors: FileEditorPresence[], currentUserUuid?: string) => (
    <div className={'flex flex-col gap-1 text-left'}>
        {editors.map((editor) => {
            const isSelf = editor.uuid === currentUserUuid;

            return (
                <div key={editor.uuid} className={'text-xs'}>
                    <span className={'font-medium text-neutral-100'}>{isSelf ? 'You' : editor.username}</span>
                    <span className={'text-neutral-400'}> · line {editor.line}</span>
                </div>
            );
        })}
    </div>
);

export default ({ editors, currentUserUuid, maxVisible = 2, size = 18, className }: Props) => {
    if (editors.length === 0) {
        return null;
    }

    const visible = editors.slice(0, maxVisible);
    const overflow = editors.slice(maxVisible);

    return (
        <span className={classNames(styles.presence_stack, className)} onClick={(event) => event.stopPropagation()}>
            {visible.map((editor, index) => {
                const isSelf = editor.uuid === currentUserUuid;

                return (
                    <Tooltip
                        key={editor.uuid}
                        content={buildTooltip(editor, isSelf)}
                        placement={'top'}
                        delay={{ open: 0, close: 80 }}
                    >
                        <span
                            className={classNames(styles.presence_avatar, isSelf && styles.presence_avatar_self)}
                            style={{ width: size, height: size, zIndex: visible.length - index }}
                        >
                            <Avatar name={editor.uuid} size={size} variant={'beam'} />
                        </span>
                    </Tooltip>
                );
            })}
            {overflow.length > 0 && (
                <Tooltip
                    content={buildOverflowTooltip(overflow, currentUserUuid)}
                    placement={'top'}
                    delay={{ open: 0, close: 80 }}
                >
                    <span className={styles.presence_overflow} style={{ width: size, height: size }}>
                        +{overflow.length}
                    </span>
                </Tooltip>
            )}
        </span>
    );
};
