import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Users2,
    Database,
    Settings,
    FolderClosed,
    ChevronDown,
    ChevronRight,
    Folder,
    Box,
    MapPin,
    Library,
    Wrench
} from 'lucide-react';
import clsx from 'clsx';
import { SATGAS_DATA } from '../data/mockData';

interface NavItem {
    name: string;
    path?: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: NavItem[];
}

const Sidebar = () => {
    const location = useLocation();
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['Satgas', 'Master Data']);

    // Get User Role
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const isSuperAdmin = user && (user.role === 'Superadmin' || user.role === 'Admin');

    // Extract unique Satgas types
    const uniqueSatgasTypes = Array.from(new Set(SATGAS_DATA.map(s => s.type)));

    const satgasChildren: NavItem[] = uniqueSatgasTypes.map(type => ({
        name: type,
        path: `/satgas/type/${encodeURIComponent(type)}`,
        icon: MapPin
    }));

    const baseNavItems: NavItem[] = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        {
            name: 'Satgas',
            icon: MapPin,
            children: satgasChildren
        },
        { name: 'Pengajuan Perbaikan & Sucad', path: '/pengajuan', icon: Wrench },
        { name: 'Pustaka', path: '/files', icon: Library },
        {
            name: 'Master Data',
            icon: Folder,
            children: [
                { name: 'Master User', path: '/master-user', icon: Users },
                { name: 'Master Satgas', path: '/master-satgas', icon: Users2 },
                { name: 'Data Aset', path: '/data-aset', icon: Box },
            ]
        },
        { name: 'Setting', path: '/settings', icon: Settings },
    ];

    // Filter Navigation Items
    const navItems = baseNavItems.filter(item => {
        // Only show Setting for Admin/Superadmin
        if (item.name === 'Setting') {
            return isSuperAdmin;
        }
        return true;
    });

    const toggleMenu = (menuName: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuName)
                ? prev.filter(name => name !== menuName)
                : [...prev, menuName]
        );
    };

    const isChildActive = (children: NavItem[] | undefined): boolean => {
        if (!children) return false;
        return children.some(child => child.path === location.pathname);
    };

    const renderNavItem = (item: NavItem, isChild = false) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedMenus.includes(item.name);
        const childActive = isChildActive(item.children);

        if (hasChildren) {
            return (
                <div key={item.name}>
                    <button
                        onClick={() => toggleMenu(item.name)}
                        className={clsx(
                            'w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors mx-3 my-1',
                            childActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                        )}
                        style={{ width: 'calc(100% - 1.5rem)' }}
                    >
                        <div className="flex items-center">
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </div>
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>
                    <div
                        className={clsx(
                            'overflow-hidden transition-all duration-300 ease-in-out',
                            isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        )}
                    >
                        <div className="ml-9 border-l border-gray-200 pl-2 my-1 space-y-1">
                            {item.children?.map(child => renderNavItem(child, true))}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <NavLink
                key={item.path}
                to={item.path!}
                className={({ isActive }) =>
                    clsx(
                        'flex items-center text-sm font-medium rounded-lg transition-colors my-1',
                        isChild ? 'px-3 py-2 mr-2 ml-0' : 'px-4 py-2.5 mx-3',
                        isActive
                            ? 'bg-primary text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                    )
                }
            >
                <item.icon className={clsx('mr-3', isChild ? 'w-4 h-4' : 'w-5 h-5')} />
                {item.name}
            </NavLink>
        );
    };

    return (
        <div className="w-64 bg-white text-gray-800 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto border-r border-gray-100 font-sans shadow-sm z-20">
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                    <img src="/logo-pmpp.png" alt="Logo" className="w-10 h-10 object-contain" />
                    <span className="font-bold text-xl text-primary">Sisinfo OPPD</span>
                </div>
            </div>

            <div className="p-4 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Menu
            </div>

            <nav className="flex-1 px-2 space-y-1">
                {navItems.map(item => renderNavItem(item))}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <div className="text-xs text-gray-400 text-center">
                    &copy; 2024 OPPD. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
