import React from 'react';
import { ChatMessage } from '../types';

interface ChatBubbleProps {
    message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const { sender, text, file } = message;

    if (sender === 'system') {
        return (
            <div className="text-center text-xs text-gray-400 my-2">
                {text}
            </div>
        )
    }

    const isBot = sender === 'bot';
    const bubbleClasses = isBot 
        ? 'bg-gray-200 text-gray-800 self-start rounded-r-xl rounded-bl-xl' 
        : 'bg-[#0084d4] text-white self-end rounded-l-xl rounded-br-xl';
    
    const containerClasses = isBot ? 'flex justify-start' : 'flex justify-end';

    return (
        <div className={`${containerClasses} animate-fade-in-up`}>
            <div className={`max-w-sm md:max-w-md px-4 py-3 rounded-lg shadow ${bubbleClasses}`}>
                 {text && <p>{text}</p>}
                 {file && (
                     <div className="flex items-center gap-2 bg-white/20 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium truncate">{file.name}</span>
                     </div>
                 )}
            </div>
        </div>
    );
};
