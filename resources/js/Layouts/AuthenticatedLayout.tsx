import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    Sheet,
    SheetContent,
} from '@/Components/ui/sheet';
import { Link, usePage } from '@inertiajs/react';
import { SeoHead } from '@/Components/SeoHead';
import {
    BarChart3,
    Image,
    KeyRound,
    LayoutDashboard,
    Link2,
    LogOut,
    Mail,
    Menu,
    User,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useState } from 'react';

interface NavItem {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    active: boolean;
}

interface NavSection {
    label: string;
    items: NavItem[];
}

function useNavSections(): NavSection[] {
    return [
        {
            label: 'Overview',
            items: [
                {
                    label: 'Dashboard',
                    href: route('dashboard'),
                    icon: LayoutDashboard,
                    active: route().current('dashboard'),
                },
            ],
        },
        {
            label: 'Content',
            items: [
                {
                    label: 'Bio Links',
                    href: route('admin.bio.index'),
                    icon: Link2,
                    active: route().current('admin.bio.index'),
                },
                {
                    label: 'Bio Analytics',
                    href: route('admin.bio.analytics'),
                    icon: BarChart3,
                    active: route().current('admin.bio.analytics'),
                },
                {
                    label: 'Media',
                    href: route('admin.media.index'),
                    icon: Image,
                    active: route().current('admin.media.index'),
                },
                {
                    label: 'Short Links',
                    href: route('admin.short.index'),
                    icon: Link2,
                    active: route().current('admin.short.index'),
                },
                {
                    label: 'Short Analytics',
                    href: route('admin.short.analytics'),
                    icon: BarChart3,
                    active: route().current('admin.short.analytics'),
                },
                {
                    label: 'Newsletter',
                    href: route('admin.newsletter.index'),
                    icon: Mail,
                    active: route().current('admin.newsletter.index'),
                },
            ],
        },
        {
            label: 'Account',
            items: [
                {
                    label: 'API Keys',
                    href: route('admin.api-keys.index'),
                    icon: KeyRound,
                    active: route().current('admin.api-keys.index'),
                },
                {
                    label: 'Profile',
                    href: route('profile.edit'),
                    icon: User,
                    active: route().current('profile.edit'),
                },
            ],
        },
    ];
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
    const sections = useNavSections();

    return (
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
            {sections.map((section) => (
                <div key={section.label}>
                    <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.label}
                    </p>
                    <div className="mt-2 space-y-1">
                        {section.items.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={onNavigate}
                                    className={
                                        'flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors ' +
                                        (item.active
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground')
                                    }
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </nav>
    );
}

function SidebarUser() {
    const user = usePage().props.auth.user;

    return (
        <div className="border-t p-3">
            <div className="px-3 py-2">
                <p className="truncate text-sm font-medium text-foreground">
                    {user.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                </p>
            </div>
            <Link
                href={route('logout')}
                method="post"
                as="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
                <LogOut className="h-4 w-4 shrink-0" />
                Log out
            </Link>
        </div>
    );
}

function SidebarBrand() {
    return (
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <ApplicationLogo className="block h-8 w-auto fill-current text-foreground" />
            <span className="text-sm font-semibold text-foreground">
                Harun R. Rayhan
            </span>
        </a>
    );
}

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const [showingMobileSidebar, setShowingMobileSidebar] = useState(false);

    return (
        <div className="flex min-h-screen bg-muted/30">
            <SeoHead />
            {/* Desktop sidebar */}
            <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-background lg:flex">
                <SidebarBrand />
                <NavList />
                <SidebarUser />
            </aside>

            {/* Mobile sidebar */}
            <Sheet open={showingMobileSidebar} onOpenChange={setShowingMobileSidebar}>
                <SheetContent side="left" className="flex w-64 flex-col p-0">
                    <SidebarBrand />
                    <NavList onNavigate={() => setShowingMobileSidebar(false)} />
                    <SidebarUser />
                </SheetContent>
            </Sheet>

            {/* Main column */}
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4">
                    <button
                        type="button"
                        onClick={() => setShowingMobileSidebar(true)}
                        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="min-w-0 flex-1">{header}</div>
                </div>

                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
}
