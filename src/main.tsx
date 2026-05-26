import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import { DemoProvider } from "@/components/DemoProvider"
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <DemoProvider>
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </DemoProvider>
  </BrowserRouter>,
)
