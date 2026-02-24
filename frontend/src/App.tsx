import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { ServiceDetail } from './pages/ServiceDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/service/:id" element={<ServiceDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
