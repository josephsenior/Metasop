'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User } from 'lucide-react';
import { submitUserMessage } from '@/lib/ai/actions';
import type { ClientMessage } from '@/lib/ai/context';

function ChatInterface() {
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<ClientMessage[]>([]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!inputValue.trim()) return;

        // Add user message to UI state
        const userMessage: ClientMessage = {
            id: Date.now().toString(),
            role: 'user',
            display: <div className="p-4 bg-slate-100 text-slate-800 rounded-xl rounded-tr-none">{inputValue}</div>,
        };
        setMessages(prev => [...prev, userMessage]);

        const value = inputValue;
        setInputValue('');

        // Submit user message to server action
        try {
            const response = await submitUserMessage(value);
            setMessages(prev => [...prev, response]);
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 gap-4">
            <div className="flex items-center gap-2 pb-4 border-b">
                <Bot className="w-6 h-6 text-indigo-600" />
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Generative UI Playground</h1>
                    <p className="text-sm text-slate-500">Ask for "user stories", "database schema", or "file structure"</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-50">
                        <Bot className="w-16 h-16 mb-4" />
                        <p>Try asking: <i>"Show me a database schema for a todo app"</i></p>
                    </div>
                )}
                {messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5 text-indigo-600" />
                            </div>
                        )}
                        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                            {message.display}
                        </div>
                        {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 order-2">
                                <User className="w-5 h-5 text-slate-600" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t">
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                />
                <Button type="submit" disabled={!inputValue.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                </Button>
            </form>
        </div>
    );
}

export default function Page() {
    return <ChatInterface />;
}
