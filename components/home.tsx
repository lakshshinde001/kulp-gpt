import React from 'react'
import Sidebar from './Sidebar'
import ChatAi from './chatAi'


const HomePage = () => {
  return (
    <div className='w-full overflow-hidden flex bg-neutral-950 flex-1'>
      <div className='flex-shrink-0'>
        <Sidebar/>
      </div>

      <div className='flex-1'>
        <ChatAi/>
      </div>
    </div>
  )
}

export default HomePage