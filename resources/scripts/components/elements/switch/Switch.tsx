import React, { forwardRef, useMemo } from 'react';
import classNames from 'classnames';
import { v4 } from 'uuid';
import { SwitchProps } from './types';
import styles from './style.module.css';

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, ...rest }, ref) => {
        const id = useMemo(() => v4(), []);

        return (
            <div className={styles.container}>
                <input
                    ref={ref}
                    id={id}
                    type="checkbox"
                    className={classNames(styles.toggle, className)}
                    {...rest}
                />
                <label htmlFor={id} className={styles.label} />
            </div>
        );
    }
);

export default Switch;
