import type { AccessibilityProps, Role } from 'react-native';

/**
 * 9.1 — One set of a11y props for both platforms. React Native ≥0.71 accepts `role` and
 * `aria-*` natively, and react-native-web renders them as real ARIA attributes, so shared
 * components only ever use these helpers.
 */
export type A11yProps = Pick<
  AccessibilityProps,
  | 'aria-label'
  | 'aria-disabled'
  | 'aria-busy'
  | 'aria-checked'
  | 'aria-selected'
  | 'aria-live'
  | 'aria-hidden'
> & {
  role?: Role;
  'aria-level'?: number;
};

export const a11y = {
  button: (label?: string, opts: { disabled?: boolean; busy?: boolean } = {}): A11yProps => ({
    role: 'button',
    ...(label ? { 'aria-label': label } : {}),
    'aria-disabled': opts.disabled || undefined,
    'aria-busy': opts.busy || undefined,
  }),
  heading: (level: 1 | 2 | 3 | 4 = 2): A11yProps => ({ role: 'heading', 'aria-level': level }),
  alert: (): A11yProps => ({ role: 'alert', 'aria-live': 'assertive' }),
  status: (): A11yProps => ({ 'aria-live': 'polite' }),
  switch: (label: string, checked: boolean): A11yProps => ({
    role: 'switch',
    'aria-label': label,
    'aria-checked': checked,
  }),
  radio: (label: string, selected: boolean): A11yProps => ({
    role: 'radio',
    'aria-label': label,
    'aria-checked': selected,
  }),
  hidden: (): A11yProps => ({ 'aria-hidden': true }),
};
