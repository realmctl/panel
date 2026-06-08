import React, { forwardRef } from 'react';
import classNames from 'classnames';
import { SelectProps } from './types';
import styles from './style.module.css';

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ hideDropdownArrow, className, ...rest }, ref) => (
        <select
            ref={ref}
            className={classNames(styles.select, {
                [styles.noArrow]: hideDropdownArrow,
            }, className)}
            {...rest}
        />
    )
);

export default Select;
