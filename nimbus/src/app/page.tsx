'use client';
import ChatPage from './c/[chatId]/page';

export default function ChatRootPage() {
  // Esta página se encarga de la ruta / (chat nuevo)
  // Reutiliza la lógica de la página de chat dinámica pero sin un chatId.
  return <ChatPage />;
}
