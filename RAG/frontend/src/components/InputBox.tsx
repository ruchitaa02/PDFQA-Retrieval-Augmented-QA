import { Send, Loader2, Paperclip, X } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

interface InputBoxProps {
    input: string;
    setInput: (value: string) => void;
    onSubmit: (file: File | null) => void;
    isLoading: boolean;
}

export default function InputBox({ input, setInput, onSubmit, isLoading }: InputBoxProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (((input || '').trim() || selectedFile) && !isLoading) {
                handleSubmit();
            }
        }
    };

    const handleSubmit = () => {
        onSubmit(selectedFile);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    return (
        <div className="w-full max-w-3xl mx-auto mb-6">
            {selectedFile && (
                <div className="mb-2 flex items-center bg-[#2f2f2f] rounded-lg p-2 w-max max-w-xs text-white text-sm">
                    <span className="truncate mr-2">{selectedFile.name}</span>
                    <button
                        onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="text-gray-400 hover:text-white"
                        disabled={isLoading}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="relative rounded-xl bg-[#2f2f2f] border border-[#404040] shadow-md flex items-end">
                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.png,.jpg,.jpeg"
                    disabled={isLoading}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="p-3 text-gray-400 hover:text-white transition-colors"
                >
                    <Paperclip size={20} />
                </button>

                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message OmniRAG or upload docs..."
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 bg-transparent text-white p-3 py-3.5 outline-none resize-none placeholder-gray-400 min-h-[52px] max-h-[200px] overflow-y-auto disabled:opacity-50"
                />

                <button
                    onClick={handleSubmit}
                    disabled={(!(input || '').trim() && !selectedFile) || isLoading}
                    className={`p-2 m-2 rounded-lg transition-colors flex flex-shrink-0 ${(!(input || '').trim() && !selectedFile) || isLoading
                            ? 'bg-[#404040] text-gray-500'
                            : 'bg-white text-black hover:bg-gray-200'
                        }`}
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
            </div>
            <div className="text-center mt-2 text-xs text-gray-500">
                OmniRAG can make mistakes. Consider verifying important information.
            </div>
        </div>
    );
}
