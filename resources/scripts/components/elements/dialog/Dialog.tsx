import React, { useRef, useState } from 'react';
import { Dialog as HDialog } from '@headlessui/react';
import { Button } from '@/components/elements/button/index';
import { XIcon } from '@heroicons/react/solid';
import { AnimatePresence, motion } from 'framer-motion';
import { DialogContext, IconPosition, RenderDialogProps, styles } from './';
import { cn } from '@/lib/utils';

const variants = {
    open: {
        scale: 1,
        opacity: 1,
        transition: {
            type: 'spring',
            damping: 15,
            stiffness: 300,
            duration: 0.15,
        },
    },
    closed: {
        scale: 0.75,
        opacity: 0,
        transition: {
            type: 'easeIn',
            duration: 0.15,
        },
    },
    bounce: {
        scale: 0.95,
        opacity: 1,
        transition: { type: 'linear', duration: 0.075 },
    },
};

export default ({
    open,
    title,
    description,
    onClose,
    hideCloseIcon,
    preventExternalClose,
    appearance = 'default',
    panelClassName,
    children,
}: RenderDialogProps) => {
    const container = useRef<HTMLDivElement>(null);
    const [icon, setIcon] = useState<React.ReactNode>();
    const [footer, setFooter] = useState<React.ReactNode>();
    const [iconPosition, setIconPosition] = useState<IconPosition>('title');
    const [down, setDown] = useState(false);

    const onContainerClick = (down: boolean, e: React.MouseEvent<HTMLDivElement>): void => {
        if (e.target instanceof HTMLElement && container.current?.isSameNode(e.target)) {
            setDown(down);
        }
    };

    const onDialogClose = (): void => {
        if (!preventExternalClose) {
            return onClose();
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <DialogContext.Provider value={{ setIcon, setFooter, setIconPosition, appearance }}>
                    <HDialog
                        static
                        as={motion.div}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        open={open}
                        onClose={onDialogClose}
                    >
                        <div
                            className={
                                appearance === 'admin'
                                    ? 'fixed inset-0 z-40 bg-black/60'
                                    : 'fixed inset-0 z-40 bg-gray-900/50'
                            }
                        />
                        <div className={'fixed inset-0 overflow-y-auto z-50'}>
                            <div
                                ref={container}
                                className={styles.container}
                                onMouseDown={onContainerClick.bind(this, true)}
                                onMouseUp={onContainerClick.bind(this, false)}
                            >
                                <HDialog.Panel
                                    as={motion.div}
                                    initial={'closed'}
                                    animate={down ? 'bounce' : 'open'}
                                    exit={'closed'}
                                    variants={variants}
                                    className={cn(
                                        appearance === 'admin' ? styles.adminPanel : styles.panel,
                                        panelClassName
                                    )}
                                >
                                    <div className={'flex overflow-y-auto p-6 pb-0'}>
                                        {iconPosition === 'container' && icon}
                                        <div className={'min-w-0 max-h-[70vh] flex-1'}>
                                            <div className={'flex items-center'}>
                                                {iconPosition !== 'container' && icon}
                                                <div>
                                                    {title && (
                                                        <HDialog.Title
                                                            className={
                                                                appearance === 'admin' ? styles.adminTitle : styles.title
                                                            }
                                                        >
                                                            {title}
                                                        </HDialog.Title>
                                                    )}
                                                    {description && (
                                                        <HDialog.Description
                                                            className={
                                                                appearance === 'admin' ? styles.adminDescription : undefined
                                                            }
                                                        >
                                                            {description}
                                                        </HDialog.Description>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={appearance === 'admin' ? 'text-sm text-foreground' : undefined}>
                                                {children}
                                            </div>
                                            <div className={'invisible h-6'} />
                                        </div>
                                    </div>
                                    {footer}
                                    {/* Keep this below the other buttons so that it isn't the default focus if they're present. */}
                                    {!hideCloseIcon && (
                                        <div className={'absolute right-0 top-0 m-4'}>
                                            <Button.Text
                                                size={Button.Sizes.Small}
                                                shape={Button.Shapes.IconSquare}
                                                onClick={onClose}
                                                className={appearance === 'admin' ? 'group text-muted-foreground hover:text-foreground' : 'group'}
                                            >
                                                <XIcon
                                                    className={
                                                        appearance === 'admin'
                                                            ? 'h-5 w-5 text-muted-foreground transition-transform group-hover:rotate-90 group-hover:text-foreground'
                                                            : styles.close_icon
                                                    }
                                                />
                                            </Button.Text>
                                        </div>
                                    )}
                                </HDialog.Panel>
                            </div>
                        </div>
                    </HDialog>
                </DialogContext.Provider>
            )}
        </AnimatePresence>
    );
};
