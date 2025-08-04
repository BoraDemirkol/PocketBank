import React from 'react';
import { Button } from 'antd';
import type { ButtonProps } from 'antd';

interface PrimaryButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'danger';
  fullWidth?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  children,
  style,
  type = 'primary',
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    fontWeight: 500,
    ...(fullWidth && { width: '100%' }),
    ...style
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--primary-color)',
      borderColor: 'var(--primary-color)',
    },
    danger: {
      // Uses Ant Design's default danger styling
    }
  };

  // Apply primary styling only for primary variant and primary/default type
  const shouldApplyPrimaryStyle = variant === 'primary' && (type === 'primary' || type === 'default');

  return (
    <Button
      type={type}
      danger={variant === 'danger'}
      style={{
        ...baseStyle,
        ...(shouldApplyPrimaryStyle && variantStyles.primary)
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default PrimaryButton;