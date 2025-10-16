"use client";

import { Copy, Ellipsis, EllipsisVerticalIcon, Share } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='w-full overflow-hidden  flex-1 flex md:relative'>
      <Sidebar/>
      <div className='flex-1 bg-neutral-950 relative'>
        <div className="absolute top-0 left-0 md:left-0 right-0 z-50">
          <Header />
        </div>
        {children}
      </div>
    </div>
  );
}
