
'use client';
import { AppLogo } from '@/components/logo';
import UserButton from '@/components/chat/user-button';
import Link from 'next/link';

export const Header = () => {
    return (
        <header className="fixed top-0 z-50 w-full bg-transparent">
            <div className="container flex h-16 items-center mx-auto px-4">
                <div className="mr-4 flex items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <AppLogo className="h-6 w-6 mr-2" />
                        <span className="font-bold">Nimbus</span>
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-4">
                   <UserButton />
                </div>
            </div>
        </header>
    )
}
