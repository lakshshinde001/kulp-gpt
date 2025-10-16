"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatAi from '../../../components/chatAi';
import { useChatStore } from '../../../stores/chatStore';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { loadMessages, conversations, currentConversationId, setCurrentConversationId, loadConversations } = useChatStore();

  const slug = params.slug as string;

  useEffect(() => {
    // Load conversations when component mounts
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    console.log("slug", slug);
    if (slug && conversations.length > 0) {
      // Find the conversation by ID only after conversations are loaded
      console.log("conversations", conversations);
      const conversation = conversations.find(c => c.id === parseInt(slug));
      console.log("founded conversation", conversation);

      if (conversation) {

        setCurrentConversationId(conversation.id);

        loadMessages(conversation.id);
      } else {
        console.log("no conversation found, redirecting to home");
        router.push('/');
      }
    }
  }, [slug, conversations, setCurrentConversationId, loadMessages, router]);


  return <ChatAi />;
}
