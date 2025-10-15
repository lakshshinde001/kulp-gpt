"use client";

import React, { forwardRef, useRef } from "react";
import { Input } from "./ui/input";
import { Send, Mic, Image } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  showVoiceButton?: boolean;
  className?: string;
  onImageAttach?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask kulp..",
  disabled = false,
  showVoiceButton = false,
  className = "w-full pr-24 pl-4 h-12 text-base rounded-full",
  onImageAttach,
  accept = "image/*",
  multiple = true,
  maxFiles = 5,
  maxSizeMB = 10
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleImageAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    // Validate file count
    if (files.length > maxFiles) {
      alert(`You can only select up to ${maxFiles} files at once.`);
      return;
    }

    // Validate file types
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      alert('Please select only image files.');
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > maxSizeMB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`Files must be smaller than ${maxSizeMB}MB each.`);
      return;
    }

    // Call the callback with valid files
    onImageAttach?.(files);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        value={value}
        ref={ref}
        disabled={disabled}
        className={className}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Voice button - only show when no text and voice is enabled */}
      {showVoiceButton && value.length < 1 && (
        <button
          type="button"
          disabled={disabled}
          className={`absolute ${onImageAttach ? 'right-22' : 'right-22'} top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          title="Voice input (not implemented)"
        >
          <Mic className="h-4 w-4 text-neutral-300" />
        </button>
      )}

      {/* Image attach button */}
      {onImageAttach && (
        <button
          type="button"
          onClick={handleImageAttach}
          disabled={disabled}
          className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Attach images"
        >
          <Image className="h-4 w-4 text-neutral-300" />
        </button>
      )}

      {/* Send button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="h-4 w-4 text-neutral-300" />
      </button>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
