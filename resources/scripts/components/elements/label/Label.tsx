import React, { forwardRef } from 'react';
import classNames from 'classnames';
import { LabelProps } from './types';
import styles from './style.module.css';

const Label = forwardRef<HTMLLabelElement, LabelProps>(
    ({ children, variant, className, ...rest }, ref) => (
        <label
            ref={ref}
            className={classNames(styles.label, {
                [styles.light]: variant === 'light',
            }, className)}
            {...rest}
        >
            {children}
        </label>
    )
);

export default Label;
