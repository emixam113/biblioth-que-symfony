import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import ResetPassword from "@/pages/ResetPassword.tsx";



function App(){

    return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/Register" element={<Register/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/ResetPassword" element={<ResetPassword/>}/>

      </Routes>
    </Router>
  )
}

export default App;
