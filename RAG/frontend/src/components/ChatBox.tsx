"use client";

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Message from '@/components/Message';
import InputBox from '@/components/InputBox';
import { Bot, File as FileIcon } from 'lucide-react';

interface Source {
    source: string;
    type: string;
    score: number;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: Source[];
    attachment?: string;
}

interface ChatBoxProps {
    chatId: string | null;
    onChatUpdated?: () => void;
}

export default function ChatBox({ chatId, onChatUpdated }: ChatBoxProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Fetch messages when chatId changes
    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/chats/${chatId}`);
                // Map backend messages to frontend format
                const loadedMessages = res.data.messages.map((msg: any) => ({
                    id: msg.id || Date.now().toString(),
                    role: msg.role,
                    content: msg.content,
                    sources: msg.sources,
                    attachment: msg.attachment
                }));
                setMessages(loadedMessages);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();
    }, [chatId]);

    const handleSubmit = async (file: File | null) => {
        if (!input.trim() && !file) return;
        if (!chatId) {
            alert("Please create or select a chat first.");
            return;
        }

        const queryText = input.trim();
        setIsLoading(true);

        // Optimistic update for user message
        const newUserMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: queryText,
            attachment: file ? file.name : undefined
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInput('');

        try {
            // Step 1: Handle File Upload if exists
            if (file) {
                const formData = new FormData();
                formData.append('file', file);

                await axios.post('http://localhost:8000/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (!queryText) {
                    const successMessage: ChatMessage = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `Successfully uploaded and processed ${file.name}. You can now ask questions about it.`
                    };
                    // We should probably save this system message to the backend chat history too?
                    // For now, just show it locally or use the message endpoint if we want it persisted.
                    // But the message endpoint expects user input. 
                    // Let's just show it locally for now.
                    setMessages(prev => [...prev, successMessage]);
                    setIsLoading(false);
                    return;
                }
            }

            // Step 2: Handle Query text
            if (queryText) {
                const response = await axios.post(
                    `http://localhost:8000/chats/${chatId}/message`,
                    {
                        content: queryText,
                        attachment: file ? file.name : undefined
                    },
                    { timeout: 600000 } // 10 minute timeout for Qwen3-VL
                );

                const newAssistantMessage: ChatMessage = {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: response.data.content,
                    sources: response.data.sources
                };

                setMessages(prev => [...prev, newAssistantMessage]);

                // Notify parent to refresh chat list (title might have changed)
                if (onChatUpdated) {
                    onChatUpdated();
                }
            }
        } catch (error: any) {
            console.error('Request error:', error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 3).toString(),
                role: 'assistant',
                content: "I encountered an error processing your request. Please ensure the backend is running and valid API keys are configured."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!chatId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-4">
                <Bot size={64} className="mb-4 text-gray-600" />
                <h2 className="text-xl font-semibold mb-2">Welcome to OmniRAG</h2>
                <p>Select a chat from the sidebar or create a new one to get started.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full relative">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                        <Bot size={48} className="opacity-20" />
                        <p>Start a conversation or upload a document...</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <Message key={idx} {...msg} />
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-[#2a2b32] rounded-2xl rounded-tl-none px-6 py-4 max-w-[80%] border border-[#303030]">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-10 pb-6 px-4">
                <div className="max-w-3xl mx-auto">
                    <InputBox
                        input={input}
                        setInput={setInput}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}
