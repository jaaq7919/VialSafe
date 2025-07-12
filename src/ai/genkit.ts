
import {ai} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/googleai';

ai.configure({
  plugins: [googleAI()],
});

export {ai};
