import { measureRenders } from 'reassure';

import { ThemeProvider } from '../theme';
import { Button } from './Button';

// 13.21 — Reassure tracks render-count/duration regressions for hot shared components.
test('Button render performance', async () => {
  await measureRenders(
    <ThemeProvider>
      <Button title="Hello" />
    </ThemeProvider>,
  );
});
