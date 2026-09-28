import ApplicationLogo from '@/Components/ApplicationLogo';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/Components/ui/sheet';
import { SeoHead } from '@/Components/SeoHead';
import type { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3, Calendar, ChevronDown, Image, KeyRound, LayoutDashboard,
    Link2, LogOut, Mail, Menu, PanelLeftClose, PanelLeftOpen, Ticket, User,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';

interface NavItem {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    active: boolean;
    external?: boolean;
}

interface NavSection {
    label: string;
    items: NavItem[];
    collapsible?: boolean;
}

type SharedPageProps = PageProps<{
    flash?: { type?: string; message?: string } | null;
}>;

function FlashMessage() {
    const { flash } = usePage<SharedPageProps>().props;
    if (!flash?.message) return null;

    return (
        <div className={'border px-4 py-3 text-sm ' + (flash.type === 'error'
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800')} role="status">
            {flash.message}
        </div>
    );
}

function useNavSections(): NavSection[] {
    return [
        {
            label: 'Overview',
            items: [
                { label: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, active: route().current('dashboard') },
                { label: 'Analytics', href: route('admin.analytics'), icon: BarChart3, active: route().current('admin.analytics') },
            ],
        },
        {
            label: 'Bio page', collapsible: true,
            items: [
                { label: 'Bio links', href: route('admin.bio.index'), icon: Link2, active: route().current('admin.bio.*') && !route().current('admin.bio.analytics') },
                { label: 'Bio analytics', href: route('admin.bio.analytics'), icon: BarChart3, active: route().current('admin.bio.analytics') },
                { label: 'View public page', href: '/bio', icon: User, active: false, external: true },
            ],
        },
        {
            label: 'Short links', collapsible: true,
            items: [
                { label: 'Manage links', href: route('admin.short.index'), icon: Link2, active: route().current('admin.short.*') && !route().current('admin.short.analytics') },
                { label: 'Link analytics', href: route('admin.short.analytics'), icon: BarChart3, active: route().current('admin.short.analytics') },
            ],
        },
        {
            label: 'Content',
            items: [
                { label: 'Media', href: route('admin.media.index'), icon: Image, active: route().current('admin.media.*') },
                { label: 'Newsletter', href: route('admin.newsletter.index'), icon: Mail, active: route().current('admin.newsletter.*') },
            ],
        },
        {
            label: 'Consultations',
            items: [
                { label: 'Bookings', href: '/admin/consultations/bookings', icon: Calendar, active: route().current('admin.consultations.bookings.*') },
                { label: 'Coupons', href: '/admin/consultations/coupons', icon: Ticket, active: route().current('admin.consultations.coupons.*') },
                { label: 'Availability', href: '/admin/consultations/availability', icon: Calendar, active: route().current('admin.consultations.availability.*') || route().current('admin.consultations.google.*') },
            ],
        },
        {
            label: 'Account',
            items: [
                { label: 'API keys', href: route('admin.api-keys.index'), icon: KeyRound, active: route().current('admin.api-keys.*') },
                { label: 'Profile', href: route('profile.edit'), icon: User, active: route().current('profile.edit') },
            ],
        },
    ];
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
    const sections = useNavSections();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    return (
        <nav aria-label="Admin navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {sections.map((section) => {
                const isOpen = expanded[section.label] ?? (section.items.some((item) => item.active) || section.label === 'Bio page');
                return (
                    <div key={section.label}>
                        {section.collapsible ? (
                            <button type="button" aria-expanded={isOpen} aria-controls={`nav-${section.label.replace(' ', '-')}`}
                                onClick={() => setExpanded((current) => ({ ...current, [section.label]: !isOpen }))}
                                className="flex w-full items-center justify-between rounded-md px-3 py-1 text-left text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                                {section.label}
                                <ChevronDown className={'h-4 w-4 transition-transform ' + (isOpen ? 'rotate-180' : '')} />
                            </button>
                        ) : (
                            <p className="px-3 text-xs font-semibold text-muted-foreground">{section.label}</p>
                        )}
                        <div id={`nav-${section.label.replace(' ', '-')}`} className={'mt-1 space-y-1 ' + (section.collapsible && !isOpen ? 'hidden' : '')}>
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const classes = 'flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ' +
                                    (item.active ? 'border-primary bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground');
                                const content = <><Icon className="h-4 w-4 shrink-0" />{item.label}</>;
                                return item.external ? (
                                    <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={classes}>{content}</a>
                                ) : (
                                    <Link key={item.label} href={item.href} onClick={onNavigate} aria-current={item.active ? 'page' : undefined} className={classes}>{content}</Link>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </nav>
    );
}

function SidebarUser() {
    const user = usePage().props.auth.user;
    return (
        <div className="border-t p-3">
            <div className="px-3 py-2">
                <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Link href={route('logout')} method="post" as="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                <LogOut className="h-4 w-4 shrink-0" />Log out
            </Link>
        </div>
    );
}

function SidebarBrand() {
    return (
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <ApplicationLogo className="block h-8 w-auto fill-current text-foreground" />
            <span className="text-sm font-semibold text-foreground">Harun R. Rayhan</span>
        </a>
    );
}

export default function Authenticated({ header, children }: PropsWithChildren<{ header?: ReactNode }>) {
    const [showingMobileSidebar, setShowingMobileSidebar] = useState(false);
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

    useEffect(() => {
        setDesktopSidebarOpen(window.localStorage.getItem('admin-sidebar-open') !== 'false');
    }, []);

    const toggleDesktopSidebar = () => {
        setDesktopSidebarOpen((open) => {
            window.localStorage.setItem('admin-sidebar-open', String(!open));
            return !open;
        });
    };

    return (
        <div className="flex min-h-screen bg-muted/30">
            <SeoHead />
            {desktopSidebarOpen && (
                <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-background lg:flex">
                    <SidebarBrand /><NavList /><SidebarUser />
                </aside>
            )}
            <Sheet open={showingMobileSidebar} onOpenChange={setShowingMobileSidebar}>
                <SheetContent side="left" className="flex w-64 flex-col p-0">
                    <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                    <SheetDescription className="sr-only">Navigate to dashboard sections and account settings.</SheetDescription>
                    <SidebarBrand /><NavList onNavigate={() => setShowingMobileSidebar(false)} /><SidebarUser />
                </SheetContent>
            </Sheet>
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4">
                    <button type="button" onClick={() => setShowingMobileSidebar(true)} aria-label="Open navigation"
                        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:hidden">
                        <Menu className="h-5 w-5" />
                    </button>
                    <button type="button" onClick={toggleDesktopSidebar} aria-label={desktopSidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
                        aria-expanded={desktopSidebarOpen}
                        className="hidden items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:inline-flex">
                        {desktopSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                    </button>
                    <div className="min-w-0 flex-1">{header}</div>
                </div>
                <main className="flex-1">
                    <div className="px-4 pt-4 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl"><FlashMessage /></div></div>
                    {children}
                </main>
            </div>
        </div>
    );
}
