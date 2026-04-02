import React from 'react'
import AppShell from './pages/AppShell';
import AuthProvider from './context/AuthProvider';
import ToastProvider from './context/ToastProvider';

const App = () => {
  return (
    <>
      <AuthProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </AuthProvider>
    </>
  )
}

export default App