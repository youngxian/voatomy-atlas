'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import {
  Home,
  ListTodo,
  Sparkles,
  MessageCircle,
  UsersRound,
  BarChart3,
  Building2,
  FileText,
  Bell,
  Settings,
  LogOut,
  GripVertical,
  Hexagon,
  Repeat,
  Shield,
  Wifi,
  Zap,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { config, productDashboardUrl } from '@/lib/config';
import { useAuth } from '@/lib/auth';
import NexusActivationModal from './NexusActivationModal';
import { isActivationDone, shouldOfferNexusActivation } from '@/lib/activation';

function handleLogout() {
  fetch(`${config.publicApi}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  }).finally(() => {
    document.cookie = 'session=; path=/; max-age=0';
    window.location.href = `${config.landingUrl}/auth/login`;
  });
}

interface NavItem {
  icon: React.ElementType;
  href: string;
  label: string;
}

const MAIN_ITEMS: NavItem[] = [
  { icon: Home, href: '/dashboard', label: 'Dashboard' },
  { icon: ListTodo, href: '/tickets', label: 'Tickets' },
  { icon: Sparkles, href: '/sprint/plan', label: 'Sprints' },
  { icon: MessageCircle, href: '/chat', label: 'Chat' },
  { icon: UsersRound, href: '/team', label: 'Team' },
  { icon: Building2, href: '/integrations', label: 'Integrations' },
  { icon: BarChart3, href: '/analytics', label: 'Analytics' },
  { icon: FileText, href: '/backlog', label: 'Backlog' },
];

const DEFAULT_NAV_ORDER = MAIN_ITEMS.map(i => i.href);
const NAV_ITEM_MAP = new Map(MAIN_ITEMS.map(i => [i.href, i]));
const NAV_ORDER_KEY = 'atlas_nav_order';

type ProductKey = 'atlas' | 'loop' | 'phantom' | 'signal' | 'nexus';
const PRODUCT_ICONS: Record<ProductKey, React.ElementType> = {
  atlas: Hexagon,
  loop: Repeat,
  phantom: Shield,
  signal: Wifi,
  nexus: Zap,
};
const PRODUCT_LABELS: Record<ProductKey, string> = {
  atlas: 'ATLAS',
  loop: 'LOOP',
  signal: 'SIGNAL',
  phantom: 'PHANTOM',
  nexus: 'NEXUS',
};

function useNavOrder() {
  const [order, setOrder] = useState<string[]>(DEFAULT_NAV_ORDER);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NAV_ORDER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed) && DEFAULT_NAV_ORDER.every(id => parsed.includes(id)) && parsed.length === DEFAULT_NAV_ORDER.length) {
          setOrder(parsed);
        }
      }
    } catch { /* use default */ }
  }, []);

  const updateOrder = useCallback((newOrder: string[]) => {
    setOrder(newOrder);
    try { localStorage.setItem(NAV_ORDER_KEY, JSON.stringify(newOrder)); } catch { /* ignore */ }
  }, []);

  return { order, updateOrder };
}

function SortableNavItem({
  item,
  active,
  index,
}: {
  item: NavItem;
  active: boolean;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.href });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      custom={index}
      variants={navItemVariants}
      initial="hidden"
      animate="visible"
      className="flex justify-center group/sortable relative"
    >
      <div
        className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/sortable:opacity-30 transition-opacity cursor-grab touch-none z-10"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>
      <NavTooltip label={item.label}>
        <Link
          href={item.href}
          aria-label={item.label}
          aria-current={active ? 'page' : undefined}
          className={clsx(
            'relative block rounded-full transition-transform duration-200',
            active ? 'scale-100' : 'hover:scale-105 active:scale-95',
          )}
        >
          <NavIcon icon={item.icon} active={active} />
        </Link>
      </NavTooltip>
    </motion.div>
  );
}

function NavTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group/tip relative">
      {children}
      <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-[11px] font-medium text-background opacity-0 shadow-lg transition-all duration-200 group-hover/tip:opacity-100 group-hover/tip:translate-x-0 -translate-x-1.5 z-50">
        {label}
      </span>
    </div>
  );
}

const iconVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.1 },
  tap: { scale: 0.92 },
};

const navItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  }),
};

function NavIcon({
  icon: Icon,
  active,
}: {
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <span
      className={clsx(
        'relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300',
        active ? 'bg-foreground/90' : 'sidenav-icon-inactive'
      )}
    >
      <motion.span
        className="flex items-center justify-center"
        variants={iconVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Icon
          className={clsx(
            'relative z-[1] transition-colors duration-300',
            active ? 'w-[18px] h-[18px] text-background' : 'w-[18px] h-[18px] text-muted-foreground'
          )}
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinejoin="round"
        />
      </motion.span>
    </span>
  );
}

export default function SideNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [nexusModalOpen, setNexusModalOpen] = useState(false);
  const activations = user?.product_activations;
  const offerNexus = shouldOfferNexusActivation(activations);
  const { order: navOrder, updateOrder: setNavOrder } = useNavOrder();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = navOrder.indexOf(active.id as string);
    const newIndex = navOrder.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    setNavOrder(arrayMove(navOrder, oldIndex, newIndex));
  }, [navOrder, setNavOrder]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/chat') return pathname.startsWith('/chat');
    if (href === '/sprint/plan') return pathname.startsWith('/sprint');
    if (href === '/analytics') return pathname.startsWith('/analytics');
    if (href === '/integrations') return pathname.startsWith('/integrations');
    if (href === '/backlog') return pathname.startsWith('/backlog');
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex flex-col items-center w-[72px] py-5 shrink-0 bg-card/70 border-r border-border/60 backdrop-blur pointer-events-auto">
      {/* Logo + Other product dashboards */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <NavTooltip label="ATLAS · Home">
            <Link href="/dashboard" aria-label="Home" className="flex items-center justify-center">
              <motion.span
                className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground/90"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Hexagon className="w-5 h-5 text-background" strokeWidth={2.2} strokeLinejoin="round" />
              </motion.span>
            </Link>
          </NavTooltip>
        </motion.div>
        {/* Outside motion.div so clicks are never captured by Framer layout/pointer logic */}
        <div className="flex flex-col gap-1.5 relative z-20">
          {(['loop', 'signal', 'phantom', 'nexus'] as const).map((key) => {
            const Icon = PRODUCT_ICONS[key];
            const base = config.productUrls[key];
            const to = productDashboardUrl(base);
            const available = to !== '#';
            const needsSetup = activations && !isActivationDone(activations[key]);
            const isNexusTrigger = key === 'nexus' && offerNexus;

            return (
              <NavTooltip
                key={key}
                label={
                  isNexusTrigger
                    ? 'NEXUS · Activate'
                    : needsSetup
                      ? `${PRODUCT_LABELS[key]} · Set up`
                      : available
                        ? `${PRODUCT_LABELS[key]} · Switch`
                        : `${PRODUCT_LABELS[key]} · Coming soon`
                }
              >
                {isNexusTrigger ? (
                  <button
                    type="button"
                    onClick={() => setNexusModalOpen(true)}
                    aria-label="Activate NEXUS"
                    className="relative flex items-center justify-center w-8 h-8 rounded-full sidenav-icon-inactive transition-colors cursor-pointer ring-2 ring-violet-500/40"
                  >
                    <Icon className="w-4 h-4 text-violet-600 pointer-events-none" strokeWidth={1.6} strokeLinejoin="round" />
                  </button>
                ) : available ? (
                  <a
                    href={to}
                    rel="noopener noreferrer"
                    aria-label={`Switch to ${PRODUCT_LABELS[key]}`}
                    className="relative flex items-center justify-center w-8 h-8 rounded-full sidenav-icon-inactive transition-colors cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground pointer-events-none" strokeWidth={1.6} strokeLinejoin="round" />
                    {needsSetup && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400 ring-1 ring-card" />
                    )}
                  </a>
                ) : (
                  <span className="flex items-center justify-center w-8 h-8 rounded-full opacity-40 cursor-not-allowed">
                    <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.4} strokeLinejoin="round" />
                  </span>
                )}
              </NavTooltip>
            );
          })}
        </div>
      </div>

      {/* Main nav group — reorderable */}
      <nav className="flex flex-col items-center gap-2 flex-1">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={navOrder} strategy={verticalListSortingStrategy}>
            {navOrder.map((href, i) => {
              const item = NAV_ITEM_MAP.get(href);
              if (!item) return null;
              return (
                <SortableNavItem
                  key={href}
                  item={item}
                  active={isActive(href)}
                  index={i}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </nav>

      {/* Bottom nav group */}
      <nav className="flex flex-col items-center gap-2 pt-6 mt-auto">
        <NavTooltip label="Notifications">
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative flex items-center justify-center block"
          >
            <motion.span
              className="relative flex items-center justify-center w-10 h-10 rounded-full sidenav-icon-inactive"
              variants={iconVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Bell className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.7} strokeLinejoin="round" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-destructive" aria-hidden />
            </motion.span>
          </Link>
        </NavTooltip>
        <NavTooltip label="Settings">
          <Link
            href="/settings"
            aria-label="Settings"
            className={clsx(
              'relative block rounded-full transition-transform duration-200',
              pathname.startsWith('/settings') ? 'scale-100' : 'hover:scale-105 active:scale-95',
            )}
          >
            <NavIcon icon={Settings} active={pathname.startsWith('/settings')} />
          </Link>
        </NavTooltip>
        <NavTooltip label="Sign out">
          <motion.button
            onClick={handleLogout}
            aria-label="Sign out"
            className="relative flex items-center justify-center w-10 h-10 rounded-full sidenav-icon-inactive"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <motion.span
              variants={iconVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="flex items-center justify-center"
            >
              <LogOut className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.7} strokeLinejoin="round" />
            </motion.span>
          </motion.button>
        </NavTooltip>
      </nav>
      <NexusActivationModal
        open={nexusModalOpen}
        onClose={() => setNexusModalOpen(false)}
      />
    </aside>
  );
}
