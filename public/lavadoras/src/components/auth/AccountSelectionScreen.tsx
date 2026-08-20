'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Phone, ArrowRight, Loader2, LogOut, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';