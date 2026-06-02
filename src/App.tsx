import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './components/Canvas';
import { Sidebar } from './components/Sidebar';
import { TopBar, ApiStatusBadge } from './components/TopBar';
import { SettingsDialog } from './components/SettingsDialog';
import { ToastContainer } from './components/Toast';
// PropertiesPanel replaced by NodeFloatingToolbar inside BaseNode
import { CommandPalette } from './components/CommandPalette';
import { FlowBrowser } from './components/FlowBrowser';
import { useAppStore } from './store/app-store';

export default function App() {
  const initializeFal = useAppStore((s) => s.initializeFal);

  useEffect(() => {
    initializeFal();
  }, [initializeFal]);

  return (
    <ReactFlowProvider>
      <div className="w-full h-full relative dark">
        {/* Canvas takes full screen */}
        <Canvas />
        {/* Everything else floats on top */}
        <TopBar />
        {/* Node toolbar is now rendered inside each BaseNode */}
        <Sidebar />
        <ApiStatusBadge />
        <FlowBrowser />
        <SettingsDialog />
        <ToastContainer />
        <CommandPalette />
      </div>
    </ReactFlowProvider>
  );
}
