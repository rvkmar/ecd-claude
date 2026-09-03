import type { Preview } from '@storybook/react-vite'
import React from 'react'

// Day 43 (Week 9): the app's dark mode is a `.dark` class toggled on
// <html> by ThemeProvider (src/theme/ThemeProvider.jsx), consumed by
// every token in src/index.css. Storybook's own dark-mode addons style
// the Storybook UI chrome, not the story iframe's document element, so
// they don't flip our tokens -- a plain toolbar item that toggles the
// class directly on the preview iframe's <html> is what actually
// exercises the same code path a real user's theme toggle does.
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: { disable: true }, // bg-background token already paints the canvas
  },
  globalTypes: {
    theme: {
      description: 'Light/dark theme (drives the app\'s own .dark class, same as ThemeToggle)',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      const isDark = context.globals.theme === 'dark';
      React.useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
      }, [isDark]);
      return (
        <div className="bg-background text-foreground p-6">
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
