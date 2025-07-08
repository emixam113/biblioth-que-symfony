import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Register';
import Dashboard from './pages/Dashboard';



function App(){
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/Login" element={<Login/>}/>
        <Route path="/Register" element={<Signup/>}/>
        <Route path="/Dashboard" element={<Dashboard/>}/>

      </Routes>
    </Router>
  )
}

export default App;
