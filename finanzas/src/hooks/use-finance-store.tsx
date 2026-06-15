'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, onSnapshot, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  AVAILABLE_CURRENCIES,
  getLocalDay,
  getLocalTime,
  normalizeText,
  resolveCategory,
  enrichBudgets,
  computeTotals,
} from '@/lib/finance-utils';

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'gasto' | 'ingreso';
  userId: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  allDay?: boolean;
  category: 'trabajo' | 'finanzas' | 'salud' | 'personal' | 'ocio';
  notifiedStages?: {
    pre?: boolean;
    start?: boolean;
    post?: boolean;
  };
  userId: string;
};

export type Budget = {
  id: string;
  category: string;
  limit: number;
  spent: number;
  funded: number;
  startDate?: string;
  endDate?: string;
  allocationType: 'manual' | 'fixed' | 'percentage';
  allocationValue: number;
  type: 'gasto' | 'ingreso';
  userId: string;
  daysUntilDepletion?: number | null;
  avgDailySpent?: number;
};

export type Currency = {
  code: string;
  symbol: string;
  name: string;
};

export type AnalysisResult = {
  summary: string;
  overspendingAreas: { category: string; details: string }[];
  savingsOpportunities: { opportunity: string; suggestion: string }[];
  behavioralPatterns?: { pattern: string; impact: string; action: string }[];
  insights: string[];
  transactionCountAtAnalysis: number;
  generatedAt: string;
  survivalSteps?: string[];
};

interface FinanceContextType {
  transactions: Transaction[];
  calendarEvents: CalendarEvent[];
  budgets: Budget[];
  currency: Currency;
  lastAnalysis: AnalysisResult | null;
  isSyncing: boolean;
  isInitialized: boolean;
  totals: {
    income: number;
    expense: number;
    balance: number;
    funded: number;
    libre: number;
    realAvailable: number;
    vitalityScore: number;
  };
  addTransaction: (t: any) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (category: string, limit: number, startDate?: string, endDate?: string, type?: 'gasto' | 'ingreso') => string;
  deleteBudget: (id: string) => void;
  updateBudgetLimit: (id: string, newLimit: number, startDate?: string, endDate?: string, category?: string) => void;
  updateBudgetAllocation: (id: string, type: any, value: number) => void;
  addCalendarEvent: (e: any) => void;
  markEventNotified: (id: string, stage: string) => void;
  changeCurrency: (c: Currency) => void;
  updateLastAnalysis: (a: any) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [rawBudgets, setRawBudgets] = useState<Budget[]>([]);
  const [currency, setCurrency] = useState<Currency>(AVAILABLE_CURRENCIES[0]);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const budgets = useMemo(
    () => enrichBudgets(rawBudgets, transactions),
    [rawBudgets, transactions]
  );

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      const localT = localStorage.getItem('finanzas_transactions');
      const localB = localStorage.getItem('finanzas_budgets');
      const localE = localStorage.getItem('finanzas_events');
      const localA = localStorage.getItem('finanzas_analysis');

      if (localT) setTransactions(JSON.parse(localT));
      if (localB) setRawBudgets(JSON.parse(localB));
      if (localE) setCalendarEvents(JSON.parse(localE));
      if (localA) setLastAnalysis(JSON.parse(localA));
      
      setIsInitialized(true);
      setIsSyncing(false);
    } else if (db) {
      setIsSyncing(true);

      const unsubT = onSnapshot(query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc')), 
        (snap) => {
          setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id } as Transaction)));
          setIsInitialized(true);
          setIsSyncing(false);
        },
        (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${user.uid}/transactions`, operation: 'list' }));
          setIsInitialized(true);
        }
      );
      
      const unsubB = onSnapshot(collection(db, 'users', user.uid, 'budgets'), 
        (snap) => setRawBudgets(snap.docs.map(d => ({ ...d.data(), id: d.id } as Budget))));
      
      const unsubE = onSnapshot(collection(db, 'users', user.uid, 'calendar_events'), 
        (snap) => setCalendarEvents(snap.docs.map(d => ({ ...d.data(), id: d.id } as CalendarEvent))));
      
      const unsubA = onSnapshot(doc(db, 'users', user.uid, 'analysis', 'latest'), 
        (snap) => snap.exists() ? setLastAnalysis(snap.data() as AnalysisResult) : setLastAnalysis(null));

      return () => { 
        unsubT(); unsubB(); unsubE(); unsubA(); 
      };
    }
  }, [user, isUserLoading, db]);

  useEffect(() => {
    if (isInitialized && !user) {
      localStorage.setItem('finanzas_transactions', JSON.stringify(transactions));
      localStorage.setItem('finanzas_budgets', JSON.stringify(rawBudgets));
      localStorage.setItem('finanzas_events', JSON.stringify(calendarEvents));
    }
  }, [transactions, rawBudgets, calendarEvents, isInitialized, user]);

  const updateLastAnalysis = useCallback((a: any) => {
    if (user && db) {
      const data = { ...a, generatedAt: new Date().toISOString(), transactionCountAtAnalysis: transactions.length };
      setDoc(doc(db, 'users', user.uid, 'analysis', 'latest'), data).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${user.uid}/analysis/latest`, operation: 'write', requestResourceData: data }));
      });
    } else {
      setLastAnalysis(a);
      localStorage.setItem('finanzas_analysis', JSON.stringify(a));
    }
  }, [user, db, transactions.length]);

  const totals = useMemo(
    () => computeTotals(transactions, budgets),
    [transactions, budgets]
  );

  const addTransaction = useCallback((t: any) => {
    const amount = parseFloat(t.amount) || 0;
    const dayKey = t.date ? (t.date.includes('T') ? t.date.split('T')[0] : t.date) : getLocalDay();
    const finalFullDate = t.date && t.date.includes('T') ? t.date : `${dayKey}T${getLocalTime()}:00`;

    const { canonical: finalCategoryName, normalized: normalizedInput } = resolveCategory(t.category || '');

    const data: Omit<Transaction, 'id'> = {
      description: t.description || 'Sin descripción',
      amount,
      category: finalCategoryName,
      date: finalFullDate,
      type: t.type === 'ingreso' ? 'ingreso' : 'gasto',
      userId: user?.uid || 'local'
    };

    if (user && db) {
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'transactions'), data);
    } else {
      setTransactions(prev => [{ ...data, id: Date.now().toString() }, ...prev]);
    }

    const [year, month] = dayKey.split('-');
    const deterministicId = `budget_${year}_${month}_${normalizedInput}_${t.type === 'ingreso' ? 'ingreso' : 'gasto'}`;

    const targetBudgetInCycle = rawBudgets.find(b => b.id === deterministicId);

    if (!targetBudgetInCycle) {
      const dEnd = new Date(parseInt(year), parseInt(month), 0);
      const autoEndDate = `${year}-${month}-${String(dEnd.getDate()).padStart(2, '0')}`;

      const newBudgetData: Budget = {
        id: deterministicId,
        category: finalCategoryName,
        limit: 0,
        spent: 0,
        funded: 0,
        startDate: `${year}-${month}-01`,
        endDate: autoEndDate,
        allocationType: 'manual',
        allocationValue: 0,
        type: t.type === 'ingreso' ? 'ingreso' : 'gasto',
        userId: user?.uid || 'local'
      };

      if (user && db) {
        setDocumentNonBlocking(doc(db, 'users', user.uid, 'budgets', deterministicId), newBudgetData, { merge: true });
      } else {
        setRawBudgets(prev => {
          if (prev.some(b => b.id === deterministicId)) return prev;
          return [{ ...newBudgetData }, ...prev];
        });
      }
    }
  }, [user, db, rawBudgets]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (user && db) deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'transactions', id));
    else setTransactions(prev => prev.filter(t => t.id !== id));
  }, [user, db]);

  const addBudget = (cat: string, limit: number, s?: string, e?: string, type: 'gasto' | 'ingreso' = 'gasto') => {
    let startDay = s || getLocalDay();
    let finalEndDate = e;
    if (!finalEndDate) {
      const [y, m] = startDay.split('-');
      const d = new Date(parseInt(y), parseInt(m), 0);
      finalEndDate = `${y}-${m}-${String(d.getDate()).padStart(2, '0')}`;
    }

    const [year, month] = startDay.split('-');
    const normalizedCat = normalizeText(cat);
    const deterministicId = `budget_${year}_${month}_${normalizedCat}_${type}`;

    const data: Budget = {
      id: deterministicId,
      category: cat,
      limit,
      spent: 0,
      funded: 0,
      startDate: startDay,
      endDate: finalEndDate,
      allocationType: 'manual',
      allocationValue: 0,
      type,
      userId: user?.uid || 'local',
    };

    if (user && db) {
      setDocumentNonBlocking(doc(db, 'users', user.uid, 'budgets', deterministicId), data, { merge: true });
      return deterministicId;
    } else {
      setRawBudgets(prev => {
        const filtered = prev.filter(b => b.id !== deterministicId);
        return [{ ...data }, ...filtered];
      });
      return deterministicId;
    }
  };

  const deleteBudget = (id: string) => {
    if (user && db) deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'budgets', id));
    else setRawBudgets(prev => prev.filter(b => b.id !== id));
  };

  const updateBudgetLimit = (id: string, limit: number, start?: string, end?: string, category?: string) => {
    const data: any = { limit };
    if (start) data.startDate = start;
    if (end) data.endDate = end;
    if (category) data.category = category;
    if (user && db) updateDocumentNonBlocking(doc(db, 'users', user.uid, 'budgets', id), data);
    else setRawBudgets(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  };

  const updateBudgetAllocation = (id: string, type: any, value: number) => {
    if (user && db) updateDocumentNonBlocking(doc(db, 'users', user.uid, 'budgets', id), { allocationType: type, allocationValue: value });
    else setRawBudgets(prev => prev.map(b => b.id === id ? { ...b, allocationType: type, allocationValue: value } : b));
  };

  const addCalendarEvent = (e: any) => {
    const data = { ...e, userId: user?.uid || 'local', notifiedStages: {} };
    if (user && db) addDocumentNonBlocking(collection(db, 'users', user.uid, 'calendar_events'), data);
    else setCalendarEvents(prev => [{ ...data, id: Date.now().toString() }, ...prev]);
  };

  const markEventNotified = (id: string, stage: string) => {
    if (user && db) updateDocumentNonBlocking(doc(db, 'users', user.uid, 'calendar_events', id), { [`notifiedStages.${stage}`]: true });
    else setCalendarEvents(prev => prev.map(e => e.id === id ? { ...e, notifiedStages: { ...e.notifiedStages, [stage]: true } } : e));
  };

  const updateTransaction = (id: string, data: any) => {
    if (user && db) updateDocumentNonBlocking(doc(db, 'users', user.uid, 'transactions', id), data);
    else setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  };

  return (
    <FinanceContext.Provider value={{
      transactions, calendarEvents, budgets, currency, lastAnalysis, totals, isSyncing, isInitialized,
      addTransaction, updateTransaction, deleteTransaction,
      addBudget, deleteBudget, updateBudgetLimit, updateBudgetAllocation,
      addCalendarEvent, markEventNotified, changeCurrency: setCurrency, updateLastAnalysis
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinanceStore = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinanceStore error');
  return context;
};
