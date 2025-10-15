"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../stores/chatStore';
import Sidebar from '../components/Sidebar';
import ChatInput from '../components/ChatInput';

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

  const handleImageAttach = (files: File[]) => {
    // TODO: Implement image attachment functionality
    console.log('Attached images:', files);
    // You can store the files in state or send them directly to the API
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
                  <ChatInput
                    ref={inputRef}
                    value={input}
                    onChange={onChangeHandler}
                    onSubmit={handleSubmit}
                    onImageAttach={handleImageAttach}
                    disabled={isLoading || isCreating}
                    showVoiceButton={true}
                    className="w-full pr-24 pl-4 h-12 text-base rounded-full"
                  />
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
                  <ChatInput
                    value={input}
                    onChange={onChangeHandler}
                    onSubmit={handleSubmit}
                    onImageAttach={handleImageAttach}
                    disabled={isLoading || isCreating}
                    showVoiceButton={true}
                    className="w-full pr-24 pl-4 h-12 text-base rounded-full"
                  />
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
