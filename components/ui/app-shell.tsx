'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ChevronRight, LogOut, ShieldCheck, UserRound, X } from 'lucide-react';
import { Topbar } from '@/components/ui/topbar';
import { createBrowserSupabaseClient } from '@/services/supabase-browser';
import { useConfirm } from '@/components/ui/confirm-dialog';
import type { ShellLink } from '@/components/ui/shell-config';

type AppShellProps = {
  children: ReactNode;
  links: readonly ShellLink[];
  homeHref: string;
  brandSubtitle: string;
  profileHref: string;
  profileBadge: string;
  dashboardHref: string;
  footerLabel: string;
  extraNav?: ReactNode;
};
