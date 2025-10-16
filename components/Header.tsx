import { Share, Ellipsis, Plus } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';
import { useChatStore } from '../stores/chatStore';
import { useRouter } from 'next/navigation';

export default function Header() {
    const isMobile = useIsMobile();
    const { createConversation, isCreatingConversation } = useChatStore();
    const router = useRouter();


    const handleNewConversation = async () => {
        try {
            const newConversation = await createConversation('New Chat')

            router.push(`/conversations/${newConversation.id}`)
        } catch (error) {
            console.error('Error creating conversation:', error)
        }
    }

  return (
    <div className="flex-shrink-0 h-16 bg-transparent flex justify-between ml-13 md:ml-4 items-center px-4 md:px-6 z-50 fixed top-0 left-0 right-0">
      <p className='text-neutral-200 text-xl font-semibold  cursor-pointer' onClick={() => router.push('/')}>KulpGPT</p>
    
      {
            !isMobile && (
                <div className='flex items-center gap-4'>
        
        
        
                <div className='flex items-center gap-2'>
                  <Share size={20} className='text-neutral-400 cursor-pointer' />
                  <p className='text-neutral-400 cursor-pointer'>Share</p>
                </div>
                <Ellipsis size={20} className='text-neutral-400 cursor-pointer' />
              </div>
            )
        }

        {
            isMobile && (
                <div className='flex items-center gap-2'>
                  <Plus
                    size={20}
                    className={`text-neutral-400 cursor-pointer ${isCreatingConversation ? 'animate-spin opacity-50' : 'hover:text-neutral-200'}`}
                    onClick={handleNewConversation}
                  />
                </div>
            )
        }
    
     
    </div>
  );
}
