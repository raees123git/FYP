import React from 'react'
import ProfileCompletionCheck from '@/components/ProfileCompletionCheck'

const MainLayout = ({ children }) => {
    
    return (
        <ProfileCompletionCheck>
            <div className='container mx-auto mt-24 mb-20'>
                {children}
            </div>
        </ProfileCompletionCheck>
    )
}

export default MainLayout
