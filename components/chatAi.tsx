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
    isCreatingConversation,
  } = useChatStore();

  const [collapsedReasoning, setCollapsedReasoning] = useState<Map<number, boolean>>(new Map());
  const [executing, setExecuting] = useState(false);
  const executingRef = useRef(false);
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
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading || executingRef.current) {
      return;
    }

    try {
      // Clear input immediately to prevent multiple submissions
      setInput("");
      setTimeout(() => {
        setExecuting(true);
        executingRef.current = true;
      },500)
      await sendMessage(trimmedInput);
      inputRef.current?.focus();
      setTimeout(() => {
        executingRef.current = false;
        setExecuting(false);
      })
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore input on error
      setInput(trimmedInput);
      executingRef.current = false;
      setExecuting(false);
    }
  };

  const handleImageAttach = (files: File[]) => {
    // TODO: Implement image attachment functionality
    console.log('Attached images:', files);
    // You can store the files in state or send them directly to the API
  };

  return (
    <div className="flex h-[100dvh]">
     
      <div className="flex-1 flex flex-col">
        
        <div className="flex-1 overflow-y-auto p-4 pb-20 mt-14">
          <div className="max-w-4xl mx-auto space-y-4">
            {isCreatingConversation ? (
              <div className="flex justify-center items-center h-full min-h-[60vh] flex-col gap-6">
                <p className="text-4xl md:text-6xl font-semibold tracking-wide text-center text-gray-500">
                  Creating New Chat...
                </p>
              </div>
            )  : messages.length > 0 ? (
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

                          {m.content && m.content.length > 0 && (
                            <div className="prose prose-invert max-w-none prose-sm bg-neutral-900 rounded-lg p-4">
                              <ReactMarkdown>
                                {m.content}
                              </ReactMarkdown>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : null  }
              {executingRef.current ? (
                <div className="flex justify-start text-neutral-400">
                  <div className="px-4 py-2 max-w-[75%] break-words text-neutral-300 mr-12">
                    <div className="space-y-3">
                      <div className="bg-neutral-900 rounded-lg">
                        <div className="flex items-center justify-between p-3">
                          <div className="text-xs  font-medium flex items-center gap-2">
                           
                            Thinking...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
          </div>
          <div ref={messagesEndRef} />
        </div>



        <div className="flex-shrink-0 p-4 md:relative fixed bottom-0 left-0 right-0 bg-neutral-950 z-40 md:bg-transparent md:z-auto md:p-4">
          <div className="max-w-4xl mx-auto md:mx-auto mx-4">
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
      
      </div>
    </div>
  );
};

export default ChatAi;
