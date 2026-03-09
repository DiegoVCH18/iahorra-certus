/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import MainLayout from './components/MainLayout';
import Splash from './views/Splash';
import Login from './views/Login';
import Onboarding from './views/Onboarding';
import Home from './views/Home';
import Chat from './views/Chat';
import Simulator from './views/Simulator';
import Education from './views/Education';
import Frauds from './views/Frauds';
import Progress from './views/Progress';
import Profile from './views/Profile';
import Budget from './views/Budget';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          
          <Route element={<MainLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/education" element={<Education />} />
            <Route path="/frauds" element={<Frauds />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
