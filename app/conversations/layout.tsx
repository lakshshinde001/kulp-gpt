"use client";

import Sidebar from '../../components/Sidebar';

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='w-full overflow-hidden bg-neutral-950 flex-1 flex md:relative'>
      <Sidebar/>
      <div className='flex-1'>
        {children}
      </div>
    </div>
  );
}
