import { Plus, MessageSquare, Settings, User, Trash2 } from 'lucide-react';

interface Chat {
    id: string;
    title: string;
    created_at: number;
}

interface SidebarProps {
    chats: Chat[];
    activeChatId: string | null;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onNewChat: () => void;
    className?: string;
}

export default function Sidebar({ chats, activeChatId, onSelectChat, onDeleteChat, onNewChat, className }: SidebarProps) {
    return (
        <div className={`w-[260px] flex-shrink-0 bg-[#171717] h-screen flex flex-col ${className || ''}`}>
            {/* App Title Area */}
            <div className="p-4 flex items-center gap-3 hover:bg-[#202123] cursor-pointer rounded-xl mx-2 mt-2 transition-colors">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" fill="#212121" />
                        <path d="M12 2V9M12 15V22M4.92893 4.92893L7.75736 7.75736M16.2426 16.2426L19.0711 19.0711M2 12H9M15 12H22M4.92893 19.0711L7.75736 16.2426M16.2426 7.75736L19.0711 4.92893" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <span className="text-white font-bold text-[17px] tracking-wide">OmniRAG</span>
            </div>

            <div className="p-3">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#202123] transition-colors text-white text-sm font-medium border border-[#303030]"
                >
                    <Plus size={16} />
                    New chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto w-full px-3 py-2 space-y-1 scrollbar-none">
                <div className="text-xs font-semibold text-gray-500 mb-2 px-2 pt-2">Chats</div>

                {chats.length === 0 && (
                    <div className="text-gray-500 text-sm px-2">No chats yet.</div>
                )}

                {chats.map(chat => (
                    <div
                        key={chat.id}
                        className={`group relative w-full flex items-center rounded-lg transition-colors cursor-pointer ${activeChatId === chat.id ? 'bg-[#2a2b32] text-white' : 'hover:bg-[#202123] text-gray-300'
                            }`}
                    >
                        <button
                            onClick={() => onSelectChat(chat.id)}
                            className="flex-1 flex items-center gap-3 px-3 py-3 text-sm text-left truncate pr-8"
                        >
                            <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{chat.title || "New Chat"}</span>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(chat.id);
                            }}
                            className="absolute right-2 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Chat"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>


        </div>
    );
}
