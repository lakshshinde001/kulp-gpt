"use client"

import { SidebarClose, MessageSquarePlus, Menu } from 'lucide-react'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '../stores/chatStore'
import { motion, stagger } from 'motion/react'

const Sidebar = () => {
    const router = useRouter()
    const { conversations, currentConversationId, loadConversations, createConversation, switchConversation, sidebarOpen, toggleSidebar, isLoading, setSidebarOpen } = useChatStore()

    // Check if we're on mobile
    const [isMobile, setIsMobile] = React.useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleNewConversation = async () => {
        try {
            const newConversation = await createConversation('New Chat')

            router.push(`/conversations/${newConversation.id}`)
        } catch (error) {
            console.error('Error creating conversation:', error)
        }
    }

    const handleConversationClick = (conversationId: number) => {

        if(isMobile) {
            setSidebarOpen(false)
        }
        router.push(`/conversations/${conversationId}`)
    }

    // Load conversations on component mount
    useEffect(() => {
        loadConversations()
    }, [loadConversations])

    const variants = {
      open: isMobile ? {
        x: 0,
        width: '280px'
      } : {
        width: '300px'
      },
      closed: isMobile ? {
        x: '-100%',
        width: '280px'
      } : {
        width: '65px'
      }
    }

    const navVariants = {
        open: {
            transition: { delayChildren: stagger(0.07, { startDelay: 0.2 }) },
        },
        closed: {
            transition: { delayChildren: stagger(0.05, { from: "last" }) },
        },
    }

    const itemVariants = {
        open: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 24
            }
        },
        closed: {
            opacity: 0,
            y: 20,
            transition: {
                duration: 0.2
            }
        }
    }
  return (
    <>

      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2  rounded-lg transition-colors md:hidden"
        >
          <Menu size={20} className="text-neutral-300" />
        </button>
      )}


      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <motion.div
        className={`${
          isMobile
            ? 'fixed top-0 left-0 z-50 h-[100dvh] flex flex-col bg-gradient-to-t from-neutral-950 via-neutral-900 to-red-950 border-r border-neutral-700'
            : 'flex-shrink-0 flex flex-col justify-between h-[100dvh] bg-gradient-to-t from-neutral-950 via-neutral-900 to-red-950 border-r border-neutral-700 overflow-hidden'
        }`}
        variants={variants}
        initial="closed"
        animate={sidebarOpen ? 'open' : 'closed'}
        transition={isMobile ? {
          type: 'spring',
          stiffness: 300,
          damping: 30
        } : {
          type: 'spring',
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }}
      >
    
        <div className={`flex-shrink-0 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} p-4`}>
            {sidebarOpen && (
              <h1 className='text-neutral-200 text-xl font-semibold'>
                  KulpGPT
              </h1>
            )}
            <button
              onClick={toggleSidebar}
              className='p-2 rounded-lg hover:bg-neutral-800 transition-colors'
            >
              <SidebarClose size={20} className='text-neutral-400' />
            </button>
        </div>

      
        <div className={`flex-1  min-h-0 ${sidebarOpen ? 'overflow-y-auto' : 'overflow-hidden'}`}>
            <div className={`${sidebarOpen ? 'px-4' : 'px-2'} py-2`}>
                <button
                    onClick={handleNewConversation}
                    className={`w-full flex items-center ${sidebarOpen ? 'gap-2 px-3' : 'justify-center px-2'} py-2 text-sm text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors`}
                    title={sidebarOpen ? '' : 'New Chat'}
                >
                    <MessageSquarePlus size={16} />
                    {sidebarOpen && <span>New Chat</span>}
                </button>
            </div>

            {sidebarOpen && (
              <div className='px-4 py-2'>
                  <h3 className='text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2'>
                      Recent Chats
                  </h3>
              </div>
            )}

            <div className={`${sidebarOpen ? 'px-4' : 'px-2'} pb-4`}>
                { isLoading && conversations.length === 0 ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className={`h-10 bg-neutral-700 rounded-lg ${sidebarOpen ? 'w-full' : 'w-10 mx-auto'}`}></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <motion.ul
                        className='space-y-1'
                        variants={navVariants}
                        initial={false}
                        animate={sidebarOpen ? "open" : "closed"}
                    >
                        {conversations.map((conversation) => (
                            <motion.li
                                key={conversation.id}
                                variants={itemVariants}
                            >
                                <button
                                    onClick={() => handleConversationClick(conversation.id)}
                                    className={`w-full flex items-center ${sidebarOpen ? 'text-left px-3 gap-2' : 'justify-center px-2'} py-2 text-sm rounded-lg transition-colors ${
                                        conversation.id === currentConversationId
                                            ? 'bg-neutral-800 text-white'
                                            : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                                    }`}
                                    title={sidebarOpen ? '' : (conversation.title || `Chat ${conversation.id}`)}
                                >

                                    {sidebarOpen && (
                                      <div className='flex-1 min-w-0'>
                                          <div className='truncate text-left'>
                                              {conversation.title || `Chat ${conversation.id}`}
                                          </div>
                                          <div className='text-xs text-neutral-500 mt-1'>
                                              {new Date(conversation.createdAt).toLocaleDateString()}
                                          </div>
                                      </div>
                                    )}
                                </button>
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </div>
        </div>

    
          <div className='flex-shrink-0 flex p-4 gap-2 items-center justify-start border-t border-neutral-700'>
              <div className='h-8 w-8 bg-neutral-600 rounded-full flex items-center justify-center flex-shrink-0'>
                  <span className='text-sm font-semibold text-white'>K</span>
              </div>
               {sidebarOpen && <div className='flex flex-col gap-1 text-sm min-w-0 flex-1'>
                  <p className='text-neutral-200 truncate'>Kulp Dev</p>
                  <p className='text-xs text-neutral-400 truncate'>Plus User</p>
              </div>}
          </div>
     
      </motion.div>
    </>
  )
}

export default Sidebar