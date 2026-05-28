
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ChatSidebar from "@/components/chat/chat-sidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    // This layout is currently not used. The main logic is in app/page.tsx
    // which uses ChatLayout directly. This file is kept for potential future routing structures.
  return (
    <SidebarProvider>
      <div className="bg-background text-foreground flex h-screen flex-col">
        <div className="flex flex-1 overflow-hidden">
            {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
