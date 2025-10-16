"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatAi from '../../../components/chatAi';
import { useChatStore } from '../../../stores/chatStore';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { conversations, currentConversationId, setCurrentConversationId, loadConversations, switchConversation } = useChatStore();

  const slug = params.slug as string;

  // Load conversations if not already loaded
  useEffect(() => {
    if (conversations.length === 0) {
      loadConversations();
    }
  }, [conversations.length, loadConversations]);

  // Switch to the specific conversation once conversations are loaded
  useEffect(() => {
    if (slug && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === parseInt(slug));

      if (conversation) {
        // Switch to the conversation (this will set messages from conversation data)
        switchConversation(conversation.id);
      } else {
        router.push('/');
      }
    }
  }, [slug, conversations.length, switchConversation, router]);


  return <ChatAi />;
}
