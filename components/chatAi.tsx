"use client";

import React, { useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send, Menu, Voicemail, Mic } from "lucide-react";
import { useChatStore } from "../stores/chatStore";

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

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

 
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    inputRef.current?.focus();
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
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2  max-w-[75%] break-words ${
                      m.role === "user"
                        ? "bg-neutral-900 text-white ml-12 rounded-full"
                        : " text-neutral-400 mr-12"
                    }`}
                  >
                    {m.role === "user" ? (
                      m.content
                    ) : (
                      <div className="prose prose-invert max-w-none prose-sm bg-neutral-900 rounded-lg p-4">
                        <ReactMarkdown>
                          {m.content}
                        </ReactMarkdown>
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
                          disabled={isLoading}
                          className="w-full pr-12 pl-4 h-12 text-base rounded-full"
                          autoFocus={false}
                        />

                        {input.length < 1 && (
                          <button
                            type="button"
                            disabled={isLoading}
                            className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Voice input (not implemented)"
                          >
                            <Mic className="h-4 w-4 text-neutral-300" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isLoading}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="h-4 w-4 text-neutral-300" />
                        </button>
                      </div>
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
                  disabled={isLoading}
                  className="w-full pr-12 pl-4 h-12 text-base rounded-full"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4 text-neutral-300" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatAi;
