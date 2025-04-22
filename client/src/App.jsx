import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import {Routes,Route} from 'react-router-dom'
import Home from './components/Home'
import Login from './components/Login'
import Signup from './components/Signup'
import DashBoard from './components/dashboard'
import PostRequest from './components/PostReqest'
import ChatApplication from './components/ChatApplication'
function App() {
  const [count, setCount] = useState(0)

  return (
    
      <>
          <Routes>
            <Route path='/' element={<Home/>}/>
            <Route path='/login' element={<Login/>}/>
            <Route path='/signup' element={<Signup/>}/>
            <Route path='/dashboard' element={<DashBoard/>}/>
            <Route path='/post-request' element={<PostRequest/>}/>
            <Route path='/chat/:chatid' element={<ChatApplication/>}/>
          </Routes>
      
      </>
  )
}

export default App
