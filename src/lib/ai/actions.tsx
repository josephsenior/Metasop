'use server';

import { createStreamableUI } from 'ai/rsc';
import { geminiModel } from './provider';
import { generateText } from 'ai';
import { ReactNode } from 'react';

export interface ClientMessage {
    id: string;
    role: 'user' | 'assistant';
    display: ReactNode;
}

export async function submitUserMessage(input: string): Promise<ClientMessage> {
    'use server';

    const ui = createStreamableUI();

    // Simple text generation for now - tool use requires more setup in 3.4
    (async () => {
        try {
            const { text } = await generateText({
                model: geminiModel as any, // Type mismatch between AI SDK 3.4 and latest provider types
                prompt: `You are a helpful assistant. Respond concisely to: ${input}`,
            });

            ui.done(<div className="p-4 text-slate-700 bg-white rounded-lg border border-slate-200 shadow-sm">{text}</div>);
        } catch {
            ui.done(<div className="p-4 text-red-600">Error generating response</div>);
        }
    })();

    return {
        id: Date.now().toString(),
        role: 'assistant',
        display: ui.value,
    };
}
