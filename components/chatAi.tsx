"use client";

import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Menu, Voicemail, ChevronDown, ChevronRight } from "lucide-react";
import { useChatStore } from "../stores/chatStore";
import ChatInput from "./ChatInput";

const ChatAi = () => {
  const {
    messages,
    input,
    sendMessage,
    setInput,
    isLoading,
    loadMessages,
    loadConversations,
    toggleSidebar,
  } = useChatStore();

  const [collapsedReasoning, setCollapsedReasoning] = useState<Map<number, boolean>>(new Map());

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleReasoning = (messageId: number) => {
    setCollapsedReasoning(prev => {
      const newMap = new Map(prev);
      newMap.set(messageId, !newMap.get(messageId));
      return newMap;
    });
  };

 
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    inputRef.current?.focus();
  };

  const handleImageAttach = (files: File[]) => {
    // TODO: Implement image attachment functionality
    console.log('Attached images:', files);
    // You can store the files in state or send them directly to the API
  };

  return (
    <div className="flex h-[100dvh] bg-gradient-to-t from-neutral-950 via-neutral-900 to-red-950">
      <div className="flex-1 flex flex-col">
        
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="max-w-4xl mx-auto space-y-4">
            {isLoading && messages.length === 0 ? (
            
              <div className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                    <div className={`animate-pulse ${
                      i % 2 === 0
                        ? "ml-12 bg-neutral-800 rounded-full"
                        : "mr-12 bg-neutral-800 rounded-lg"
                    } ${i % 2 === 0 ? "w-48 h-10" : "w-64 h-16"}`}></div>
                  </div>
                ))}
              </div>
            ) : messages.length > 0 ? (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.role === "user" ? "justify-end text-neutral-400" : "justify-start text-neutral-400"
                  }`}
                >
                  <div
                    className={`px-4 py-2  max-w-[75%] break-words ${
                      m.role === "user"
                        ? "bg-neutral-900 text-neutral-300 ml-12 rounded-full"
                        : " text-neutral-300 mr-12"
                    }`}
                  >
                    {m.role === "user" ? (
                      m.content
                    ) : (
                      <div className="space-y-3">
                        {m.reasoning && (
                          <div className="bg-neutral-800 rounded-lg ">
                            <button
                              onClick={() => toggleReasoning(m.id)}
                              className="w-full flex items-center justify-between p-3 hover:bg-neutral-700 transition-colors rounded-lg"
                            >
                              <div className="text-xs text-blue-400 font-medium">
                                Thinking{m.duration ? ` for ${m.duration}` : '...'}
                              </div>
                              {collapsedReasoning.get(m.id) !== false ? (
                                <ChevronRight className="w-4 h-4 text-blue-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-blue-400" />
                              )}
                            </button>
                            {collapsedReasoning.get(m.id) === false && (
                              <div className="px-3 pb-3">
                                <div className="text-neutral-300 italic prose prose-invert max-w-none prose-sm">
                                  {m.reasoning }
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                          {m.toolCalls && m.toolCalls.length > 0 && (
                            <div className="space-y-1">
                              {m.toolCalls.map((toolCall) => (
                                <div key={toolCall.id} className="text-xs text-neutral-400 font-medium flex items-center bg-neutral-800 rounded-lg px-3 py-2">
                                  
                                  {toolCall.name}
                                </div>
                              ))}
                            </div>
                          )}
                        <div className="prose prose-invert max-w-none prose-sm bg-neutral-900 rounded-lg p-4">
                          <ReactMarkdown>
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-center items-center h-full min-h-[60vh] flex-col gap-6 mt-20">
                <p className="text-4xl md:text-6xl font-semibold tracking-wide text-center text-gray-500">
                  What Brings you here?
                </p>
                <div className="flex-shrink-0 p-4 ">
                  <div className="">
                    <div className="relative w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px] mx-auto">
                      <ChatInput
                        value={input}
                        onChange={onChangeHandler}
                        onSubmit={handleSubmit}
                        onImageAttach={handleImageAttach}
                        disabled={isLoading}
                        showVoiceButton={true}
                        className="w-full pr-24 pl-4 h-12 text-base rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>



        {messages.length > 0 && (
          <div className="flex-shrink-0 p-4">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                ref={inputRef}
                value={input}
                onChange={onChangeHandler}
                onSubmit={handleSubmit}
                onImageAttach={handleImageAttach}
                disabled={isLoading}
                showVoiceButton={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatAi;
