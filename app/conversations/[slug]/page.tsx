"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatAi from '../../../components/chatAi';
import { useChatStore } from '../../../stores/chatStore';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { loadMessages, conversations, currentConversationId, setCurrentConversationId } = useChatStore();

  const slug = params.slug as string;

  useEffect(() => {
    if (slug) {
      // Find the conversation by ID
      const conversation = conversations.find(c => c.id === parseInt(slug));

      if (conversation) {
       
        setCurrentConversationId(conversation.id);
      
        loadMessages(conversation.id);
      } else {
   
        router.push('/');
      }
    }
  }, [slug, conversations, setCurrentConversationId, loadMessages, router]);


  return <ChatAi />;
}
