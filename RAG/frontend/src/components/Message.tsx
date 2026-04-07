import { Bot, User, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Source {
    source: string;
    type: string;
    score: number;
}

interface MessageProps {
    role: 'user' | 'assistant';
    content: string;
    sources?: Source[];
    attachment?: string;
}

export default function Message({ role, content, sources, attachment }: MessageProps) {
    const isUser = role === 'user';

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>

            {/* Assistant Icon (Left) */}
            {!isUser && (
                <div className="w-8 h-8 rounded-full border border-[#404040] bg-white flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                    <Bot size={20} className="text-[#212121]" />
                </div>
            )}

            <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className="text-xs font-semibold mb-1 text-gray-400">
                    {isUser ? 'You' : 'OmniRAG'}
                </div>

                <div className={`relative px-4 py-3 rounded-2xl ${isUser
                        ? 'bg-[#3e3f4b] text-white rounded-tr-none'
                        : 'bg-transparent text-gray-100 px-0 py-0'
                    }`}>
                    {/* Attachment Display */}
                    {attachment && (
                        <div className="flex items-center gap-2 mb-2 bg-[#2f2f2f] p-2 rounded-lg border border-[#404040] text-sm text-gray-200">
                            <FileText size={16} className="text-blue-400" />
                            <span>{attachment}</span>
                        </div>
                    )}

                    {/* Text Content */}
                    {content && (
                        <div className={`prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#0d0d0d] prose-pre:border prose-pre:border-[#303030] prose-td:border prose-td:border-[#404040] prose-th:border prose-th:border-[#404040] max-w-none text-[15px] ${isUser ? 'whitespace-pre-wrap text-white' : 'text-gray-100'}`}>
                            {isUser ? (
                                content
                            ) : (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {content}
                                </ReactMarkdown>
                            )}
                        </div>
                    )}
                </div>

                {/* Sources (Only for Assistant) */}
                {!isUser && sources && sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#303030] w-full">
                        <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                            Sources
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {sources.filter((v, i, a) => a.findIndex(t => (t.source === v.source)) === i).map((source, idx) => (
                                <div
                                    key={idx}
                                    className={`text-[11px] px-2 py-1 rounded border flex items-center max-w-[200px] ${source.type === 'chat_history'
                                            ? 'bg-purple-900/30 border-purple-700/50 text-purple-200'
                                            : 'bg-[#2f2f2f] border-[#404040] text-gray-400'
                                        }`}
                                    title={source.source}
                                >
                                    <span className="truncate max-w-[120px]">{source.source}</span>
                                    <span className={`ml-2 px-1 py-0.5 rounded text-[9px] uppercase tracking-wider ${source.type === 'chat_history'
                                            ? 'bg-purple-800/50 text-purple-200'
                                            : 'bg-[#404040] text-gray-500'
                                        }`}>
                                        {source.type === 'chat_history' ? 'CHAT' : source.type.split('_')[0]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* User Icon (Right) */}
            {isUser && (
                <div className="w-8 h-8 rounded-full bg-[#5436DA] flex items-center justify-center ml-4 flex-shrink-0 mt-1 text-white">
                    <User size={18} />
                </div>
            )}
        </div>
    );
}
