import { useState } from 'react'
// import viteLogo from '/vite.svg'
import {Routes,Route} from 'react-router-dom'
import Home from './components/Home'
import Login from './components/Login'
import Signup from './components/Signup'
import DashBoard from './components/dashboard'
import PostRequest from './components/PostReqest'
import ChatApplication from './components/ChatApplication'
import UserProfilePage from './components/UserProfilePage'
import UserRatingsPage from './components/UserRatingsPage'

function App() {

  return (
    
      <>
          <Routes>
            <Route path='/' element={<Home/>}/>
            <Route path='/login' element={<Login/>}/>
            <Route path='/signup' element={<Signup/>}/>
            <Route path='/dashboard' element={<DashBoard/>}/>
            <Route path='/post-request' element={<PostRequest/>}/>
            <Route path='/chat/:chatid' element={<ChatApplication/>}/>
            <Route path='/profile/:userId' element={<UserProfilePage/>}/>
            <Route path='/profile/edit' element={<UserProfilePage editMode={true}/>}/>
            <Route path='/ratings/:userId' element={<UserRatingsPage/>}/>
          </Routes>
      
      </>
  )
}

export default App
