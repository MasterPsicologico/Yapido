'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAudioDrafts } from '@/components/recorder/useAudioDrafts';
import type { AudioDraft } from '@/lib/types';
import RecorderUI from '@/components/recorder/RecorderUI';
import DraftList from '@/components/recorder/DraftList';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Menu } from 'lucide-react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function RecorderPage() {
  const router = useRouter();
  const { drafts, isLoading } = useAudioDrafts();
  const [activeDraft, setActiveDraft] = useState<AudioDraft | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!isLoading && drafts.length > 0) {
      setActiveDraft(drafts[0]);
    }
  }, [isLoading, drafts]);

  const handleSelectDraft = (draft: AudioDraft) => {
    setActiveDraft(draft);
    if(isMobile) setIsSheetOpen(false);
  };
  
  const handleNewRecording = () => {
    setActiveDraft(null);
     if(isMobile) setIsSheetOpen(false);
  };

  const handleDraftCreated = (draft: AudioDraft) => {
    // When a new draft is created from a recording, it becomes the active one
    setActiveDraft(draft);
  };

  const renderSidebar = () => (
     <DraftList 
        onSelectDraft={handleSelectDraft} 
        onNewRecording={handleNewRecording} 
        activeDraftId={activeDraft?.id} 
    />
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar>
            {renderSidebar()}
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <header className="flex-shrink-0 flex items-center justify-between p-2 md:p-4 border-b">
            <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="icon" className="-ml-2 text-muted-foreground hover:bg-accent/10 hover:text-foreground">
                    <Link href="/">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-primary">Grabadora Psicológica</h1>
                    <p className="text-xs text-muted-foreground">Graba y analiza sesiones para obtener un pre-diagnóstico.</p>
                </div>
            </div>
             {isMobile && (
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="p-0 w-full max-w-sm">
                   {renderSidebar()}
                </SheetContent>
              </Sheet>
            )}
          </header>

          <main className="flex-1 overflow-y-auto">
            <RecorderUI 
                initialDraft={activeDraft} 
                onNewRecording={handleNewRecording} 
                onDraftCreated={handleDraftCreated}
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
