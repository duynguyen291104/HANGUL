'use client';

import { ReactNode, useState } from 'react';
import TopBar from './TopBar';
import SideBar from './SideBar';

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <SideBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}>
        {children}
      </SideBar>
    </>
  );
}
