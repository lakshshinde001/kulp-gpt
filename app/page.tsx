"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../stores/chatStore';
import { Input } from '../components/ui/input';
import { Send, Mic } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Home() {
  const router = useRouter();
  const { conversations, loadConversations, input, sendMessage, setInput, isLoading } = useChatStore();
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    setIsCreating(true);
    try {

      const newConversation = await useChatStore.getState().createConversation('New Chat');
 
      useChatStore.getState().setCurrentConversationId(newConversation.id);

      setIsCreating(false);
      router.push(`/conversations/${newConversation.id}`);
      await sendMessage(input);
  
     
     
      
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      
    }
  };

  return (
    <div className='w-full overflow-hidden bg-neutral-950 flex-1 flex md:relative'>
      <Sidebar/>

      {
        isCreating ? (
          <div className='flex-1 flex flex-col bg-gradient-to-t from-neutral-950 via-neutral-900 to-red-950'>
            <div className='flex-1 overflow-y-auto p-4 pb-20'>
              <div className='max-w-4xl mx-auto space-y-4'>
                <div className='flex justify-center items-center h-full min-h-[60vh] flex-col gap-6 mt-20'>
                  <p className='text-4xl md:text-6xl font-semibold tracking-wide text-center text-gray-500'>
                    Hold On...
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='flex-1 flex flex-col bg-gradient-to-t from-neutral-950 via-neutral-900 to-red-950'>
    
        <div className="flex-1 overflow-y-auto p-4 pb-20 relative">
          <div className="max-w-4xl mx-auto space-y-4">
         
            <div className="hidden md:flex justify-center items-center h-full min-h-[60vh] flex-col gap-6 mt-20">
              <p className="text-4xl md:text-6xl font-semibold tracking-wide text-center text-gray-500">
                What Brings you here?
              </p>
              <div className="flex-shrink-0 p-4">
                <div className="relative w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px] mx-auto">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Ask kulp.."
                      onChange={onChangeHandler}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      value={input}
                      ref={inputRef}
                      disabled={isLoading || isCreating}
                      className="w-full pr-12 pl-4 h-12 text-base rounded-full"
                    />

                    {input.length < 1 && (
                      <button
                        type="button"
                        disabled={isLoading || isCreating}
                        className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Voice input (not implemented)"
                      >
                        <Mic className="h-4 w-4 text-neutral-300" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading || isCreating}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4 text-neutral-300" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

       
            <div className="md:hidden relative h-full">
              <div className="flex justify-center items-center h-full min-h-[50vh] flex-col gap-6 mt-20">
                <p className="text-4xl font-semibold tracking-wide text-center text-gray-500">
                  What Brings you here?
                </p>
              </div>
              <div className="fixed bottom-4 left-4 right-4">
                <div className="relative w-full">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Ask kulp.."
                      onChange={onChangeHandler}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      value={input}
                      ref={inputRef}
                      disabled={isLoading || isCreating}
                      className="w-full pr-12 pl-4 h-12 text-base rounded-full"
                    />

                    {input.length < 1 && (
                      <button
                        type="button"
                        disabled={isLoading || isCreating}
                        className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Voice input (not implemented)"
                      >
                        <Mic className="h-4 w-4 text-neutral-300" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading || isCreating}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4 text-neutral-300" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      
    </div>
  );
}
