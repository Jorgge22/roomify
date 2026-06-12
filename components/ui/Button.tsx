// components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    className?: string;
}

const Button: React.FC<ButtonProps> = ({
                                           variant = 'primary',
                                           size = 'md',
                                           fullWidth = false,
                                           className = '',
                                           children,
                                           ...rest
                                       }) => {
    const classes = [
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth ? 'btn--fullWidth' : '',
        className,
    ]
        .filter(Boolean) // delete empty strings
        .join(' ');

    return (
        <button className={classes} {...rest}>
            {children}
        </button>
    );
};

export default Button;