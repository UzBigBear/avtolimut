import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BookQueue from './pages/BookQueue';
import MyQueue from './pages/MyQueue';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/book" element={
            <ProtectedRoute>
              <BookQueue />
            </ProtectedRoute>
          } />
          <Route path="/my-queue" element={
            <ProtectedRoute>
              <MyQueue />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
