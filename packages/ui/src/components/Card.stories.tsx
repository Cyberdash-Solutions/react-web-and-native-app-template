import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';
import { TextField } from './TextField';

const meta = { title: 'Components/Card', component: Card } satisfies Meta<typeof Card>;
export default meta;

export const Greeting: StoryObj<typeof meta> = {
  render: () => (
    <Card>
      <Text variant="display" headingLevel={1}>
        Hello, world!
      </Text>
      <Text tone="muted">Served just now</Text>
      <TextField label="Name" placeholder="Ada" />
      <Button title="Save" />
    </Card>
  ),
};
