import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Button } from './Button';

// 8.5 / 13.19 — one react-native-web Storybook; stories are snapshotted by Chromatic and
// scanned by the a11y addon (13.20).
const meta = {
  title: 'Components/Button',
  component: Button,
  args: { title: 'Say hello', onPress: () => {} },
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;
export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Danger: Story = { args: { variant: 'danger', title: 'Delete account' } };
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
