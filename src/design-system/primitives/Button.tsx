import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type BaseButtonProps = {
  children: ReactNode;
  className?: string;
};

export type AnchorButtonProps = BaseButtonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export type NativeButtonProps = BaseButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

export type ButtonProps = AnchorButtonProps | NativeButtonProps;

export function Button({ children, className = '', ...props }: ButtonProps) {
  if ('href' in props && props.href !== undefined) {
    return (
      <a className={`linkedin-btn ${className}`} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  const { type = 'button', ...buttonProps } = props as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button type={type} className={`linkedin-btn ${className}`} {...buttonProps}>
      {children}
    </button>
  );
}
