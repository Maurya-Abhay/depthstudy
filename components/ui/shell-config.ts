import type { LucideIcon } from 'lucide-react';
import {
  Award, BarChart3, BookOpen, BrainCircuit, DatabaseBackup,
  FolderKanban, LayoutDashboard, ListChecks, Route,
  ScrollText, Settings, Sparkles, Users, Bell, CalendarDays,
} from 'lucide-react';

export type ShellLink = { href: string; label: string; icon: LucideIcon };

export const adminLinks: readonly ShellLink[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/categories', label: 'Categories', icon: FolderKanban },
  { href: '/admin/topics', label: 'Topics', icon: BookOpen },
  { href: '/admin/courses', label: 'Courses', icon: FolderKanban },
  { href: '/admin/roadmaps', label: 'Roadmaps', icon: Route },
  { href: '/admin/questions', label: 'Questions', icon: ListChecks },
  { href: '/admin/tests', label: 'Tests', icon: ListChecks },
  { href: '/admin/dsa', label: 'DSA Problems', icon: BrainCircuit },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/certificates', label: 'Certificates', icon: Award },
  { href: '/admin/backup', label: 'Database Backup', icon: DatabaseBackup },
  { href: '/admin/ai', label: 'AI Studio', icon: Sparkles },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export const userLinks: readonly ShellLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/courses', label: 'My Courses', icon: FolderKanban },
  { href: '/dashboard/notes', label: 'Notes', icon: Sparkles },
  { href: '/dashboard/dsa', label: 'DSA', icon: BrainCircuit },
  { href: '/dashboard/tests', label: 'Tests', icon: ListChecks },
  { href: '/dashboard/bookmarks', label: 'Bookmarks', icon: BookOpen },
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/progress', label: 'Progress', icon: BarChart3 },
  { href: '/dashboard/roadmap', label: 'Roadmap', icon: Route },
  { href: '/dashboard/certificates', label: 'Certificates', icon: Award },
];
