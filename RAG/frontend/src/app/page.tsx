"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import ChatBox from '@/components/ChatBox';

interface Chat {
    id: string;
    title: string;
    created_at: number;
}

export default function Home() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const fetchChats = async () => {
        try {
            const res = await axios.get('http://localhost:8000/chats');
            setChats(res.data.chats);
        } catch (error) {
            console.error("Error fetching chats:", error);
        }
    };

    useEffect(() => {
        fetchChats();
    }, []);

    const handleNewChat = async () => {
        try {
            const res = await axios.post('http://localhost:8000/chats', { title: "New Chat" });
            const newChat = res.data;
            setChats([newChat, ...chats]);
            setCurrentChatId(newChat.id);
        } catch (error) {
            console.error("Error creating chat:", error);
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        try {
            await axios.delete(`http://localhost:8000/chats/${chatId}`);
            setChats(chats.filter(c => c.id !== chatId));
            if (currentChatId === chatId) {
                setCurrentChatId(null);
            }
        } catch (error) {
            console.error("Error deleting chat:", error);
        }
    };

    const handleSelectChat = (chatId: string) => {
        setCurrentChatId(chatId);
        setIsSidebarOpen(false); // Close sidebar on mobile on selection
    };

    // Callback to refresh chats (e.g., when title updates)
    const handleChatUpdated = () => {
        fetchChats();
    };

    return (
        <main className="flex h-screen w-full bg-[#212121] overflow-hidden text-white font-sans">
            <Sidebar
                chats={chats}
                activeChatId={currentChatId}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
                onNewChat={handleNewChat}
                className={isSidebarOpen ? "block absolute z-50 h-full" : "hidden md:flex"}
            />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full bg-[#212121] relative w-full">

                {/* Mobile Header (Hidden on Desktop) */}
                <header className="md:hidden flex items-center justify-between p-3 border-b border-[#303030]">
                    <div className="flex items-center gap-2 pl-1">
                        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="3" fill="#212121" />
                                <path d="M12 2V9M12 15V22M4.92893 4.92893L7.75736 7.75736M16.2426 16.2426L19.0711 19.0711M2 12H9M15 12H22M4.92893 19.0711L7.75736 16.2426M16.2426 7.75736L19.0711 4.92893" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-semibold text-gray-200">OmniRAG</span>
                    </div>
                    <button
                        className="text-gray-400 hover:text-white"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </header>

                <ChatBox
                    chatId={currentChatId}
                    onChatUpdated={handleChatUpdated}
                />
            </div>
        </main>
    );
}
