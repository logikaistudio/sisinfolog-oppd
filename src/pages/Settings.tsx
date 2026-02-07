import { useState, useEffect } from 'react';
import {
    Settings,
    Shield,
    Plus,
    Edit,
    Trash2,
    Search,
    X,
    Loader2,
    Users,
    Lock,
    Save,
    CheckSquare,
    Square
} from 'lucide-react';
import sql from '../lib/db';

// Interfaces
interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at?: string;
}

interface RolePermission {
    id?: number;
    role_name: string;
    menu_name: string;
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_import: boolean;
    can_export: boolean;
    can_print: boolean;
}

const MENUS = ['Dashboard', 'Satgas', 'Pustaka', 'Master Data', 'Setting', 'Pengajuan'];
const ROLES_DEFAULT = ['Admin', 'Pimpinan', 'Satgas', 'User'];

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');


    // User State
    const [users, setUsers] = useState<UserData[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userForm, setUserForm] = useState({ id: 0, name: '', email: '', password: '', role: 'User' });
    const [isSavingUser, setIsSavingUser] = useState(false);

    // Role State
    const [selectedRole, setSelectedRole] = useState('Admin');
    const [permissions, setPermissions] = useState<RolePermission[]>([]);
    const [isSavingRole, setIsSavingRole] = useState(false);

    // Fetch Users
    const fetchUsers = async () => {

        try {
            const result = await sql`SELECT id, name, email, role, created_at FROM users ORDER BY id DESC`;
            setUsers(result as unknown as UserData[]);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {

        }
    };

    // Fetch Permissions for Role
    const fetchPermissions = async (role: string) => {

        try {
            const result = await sql`SELECT * FROM role_permissions WHERE role_name = ${role}`;
            const existingPerms = result as unknown as RolePermission[];

            // Merge with Default Menus (if missing)
            const mergedPerms = MENUS.map(menu => {
                const found = existingPerms.find(p => p.menu_name === menu);
                return found || {
                    role_name: role,
                    menu_name: menu,
                    can_view: false,
                    can_edit: false,
                    can_delete: false,
                    can_import: false,
                    can_export: false,
                    can_print: false
                };
            });
            setPermissions(mergedPerms);
        } catch (error) {
            console.error("Failed to fetch permissions:", error);
        } finally {

        }
    };

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'roles') fetchPermissions(selectedRole);
    }, [activeTab, selectedRole]);

    // --- User Handlers ---
    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingUser(true);
        try {
            if (userForm.id) {
                if (userForm.password) {
                    await sql`UPDATE users SET name=${userForm.name}, email=${userForm.email}, role=${userForm.role}, password=${userForm.password} WHERE id=${userForm.id}`;
                } else {
                    await sql`UPDATE users SET name=${userForm.name}, email=${userForm.email}, role=${userForm.role} WHERE id=${userForm.id}`;
                }
            } else {
                await sql`INSERT INTO users (name, email, password, role) VALUES (${userForm.name}, ${userForm.email}, ${userForm.password || '123456'}, ${userForm.role})`;
            }
            fetchUsers();
            setIsUserModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan user.");
        } finally {
            setIsSavingUser(false);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!window.confirm("Hapus user ini?")) return;
        try {
            await sql`DELETE FROM users WHERE id = ${id}`;
            fetchUsers();
        } catch (e) { console.error(e); alert("Gagal hapus"); }
    };

    const openUserModal = (user?: UserData) => {
        if (user) setUserForm({ id: user.id, name: user.name, email: user.email, password: '', role: user.role });
        else setUserForm({ id: 0, name: '', email: '', password: '', role: 'User' });
        setIsUserModalOpen(true);
    };

    // --- Role Handlers ---
    const handlePermissionChange = (menuIdx: number, field: keyof RolePermission) => {
        const newPerms = [...permissions];
        // Toggle boolean
        (newPerms[menuIdx] as any)[field] = !(newPerms[menuIdx] as any)[field];
        setPermissions(newPerms);
    };

    const handleSavePermissions = async () => {
        setIsSavingRole(true);
        try {
            // Delete old perms for this role (simple strategy: upsert or delete-insert)
            // Or just Upsert loop
            for (const p of permissions) {
                // PostgreSQL upsert
                await sql`
                   INSERT INTO role_permissions (role_name, menu_name, can_view, can_edit, can_delete, can_import, can_export, can_print)
                   VALUES (${selectedRole}, ${p.menu_name}, ${p.can_view}, ${p.can_edit}, ${p.can_delete}, ${p.can_import}, ${p.can_export}, ${p.can_print})
                   ON CONFLICT (role_name, menu_name) 
                   DO UPDATE SET 
                     can_view = EXCLUDED.can_view,
                     can_edit = EXCLUDED.can_edit,
                     can_delete = EXCLUDED.can_delete,
                     can_import = EXCLUDED.can_import,
                     can_export = EXCLUDED.can_export,
                     can_print = EXCLUDED.can_print
               `;
            }
            alert("Permissions updated!");
        } catch (error) {
            console.error("Failed to save perms:", error);
            alert("Gagal update permissions.");
        } finally {
            setIsSavingRole(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Settings className="w-8 h-8 text-primary" />
                    Pengaturan Sistem
                </h1>
                <p className="text-gray-500 mt-1 ml-11">Kelola akses pengguna dan peran (Role Management).</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> User Management
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'roles' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Role Permissions
                    </div>
                </button>
            </div>

            {/* Content: Users */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Cari user..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                            />
                        </div>
                        <button onClick={() => openUserModal()} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center text-sm font-bold shadow hover:bg-primary/90 transition-colors">
                            <Plus className="w-4 h-4 mr-2" /> Tambah User
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-6 py-3">Nama Lengkap</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.filter(u => u.name.toLowerCase().includes(userSearchTerm.toLowerCase())).map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{user.name.substring(0, 2).toUpperCase()}</div>
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 flex w-fit items-center gap-1">
                                                <Shield className="w-3 h-3" /> {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => openUserModal(user)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Content: Roles */}
            {activeTab === 'roles' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Role Sidebar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-fit">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" /> Daftar Role
                        </h3>
                        <div className="space-y-1">
                            {ROLES_DEFAULT.map(role => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${selectedRole === role ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {role}
                                    {selectedRole === role && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Permissions Matrix */}
                    <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-bold text-gray-800">Hak Akses: {selectedRole}</h3>
                                <p className="text-xs text-gray-500">Atur izin akses untuk setiap menu aplikasi.</p>
                            </div>
                            <button
                                onClick={handleSavePermissions}
                                disabled={isSavingRole}
                                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                {isSavingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Simpan Perubahan
                            </button>
                        </div>

                        <div className="overflow-x-auto p-4">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="px-4 py-3 border-b">Menu Aplikasi</th>
                                        <th className="px-4 py-3 border-b text-center w-24">View</th>
                                        <th className="px-4 py-3 border-b text-center w-24">Edit</th>
                                        <th className="px-4 py-3 border-b text-center w-24">Delete</th>
                                        <th className="px-4 py-3 border-b text-center w-24">Import</th>
                                        <th className="px-4 py-3 border-b text-center w-24">Export</th>
                                        <th className="px-4 py-3 border-b text-center w-24">Print</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {permissions.map((perm, idx) => (
                                        <tr key={perm.menu_name} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-800 border-r">{perm.menu_name}</td>
                                            {['can_view', 'can_edit', 'can_delete', 'can_import', 'can_export', 'can_print'].map((action) => (
                                                <td key={action} className="px-4 py-3 text-center border-r last:border-r-0">
                                                    <button
                                                        onClick={() => handlePermissionChange(idx, action as keyof RolePermission)}
                                                        className={`p-1 rounded transition-colors ${(perm as any)[action]
                                                            ? 'text-green-600 hover:bg-green-50'
                                                            : 'text-gray-300 hover:text-gray-400'
                                                            }`}
                                                    >
                                                        {(perm as any)[action]
                                                            ? <CheckSquare className="w-5 h-5" />
                                                            : <Square className="w-5 h-5" />}
                                                    </button>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">{userForm.id ? 'Edit User' : 'Tambah User'}</h3>
                            <button onClick={() => setIsUserModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nama</label>
                                <input required type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <input required type="email" className="w-full px-3 py-2 border rounded-lg text-sm" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Password {userForm.id && <span className="font-normal text-gray-400 text-xs">(Optional)</span>}</label>
                                <input type="password" className="w-full px-3 py-2 border rounded-lg text-sm" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} placeholder={userForm.id ? "••••••" : ""} required={!userForm.id} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                                <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                                    {ROLES_DEFAULT.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-600">Batal</button>
                                <button disabled={isSavingUser} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow flex items-center">
                                    {isSavingUser && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
