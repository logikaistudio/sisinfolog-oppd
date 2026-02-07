import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Lock } from 'lucide-react';
import sql from '../lib/db';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Check credentials against Neon DB
            // Note: Currently using plain text passwords as requested/implied by Settings page implementation.
            // In production, should use bcrypt/hashing.
            const result = await sql`
                SELECT id, name, email, role, avatar 
                FROM users 
                WHERE email = ${email} AND password = ${password}
            `;

            const users = result as unknown as any[];

            if (users.length > 0) {
                const user = users[0];
                // Store minimal user info
                localStorage.setItem('user', JSON.stringify(user));
                // Redirect
                navigate('/dashboard');
            } else {
                setError('Email atau Password salah.');
            }
        } catch (err) {
            console.error("Login error:", err);
            setError('Terjadi kesalahan saat login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-primary/5 p-8 text-center border-b border-primary/10">
                    <div className="mx-auto flex items-center justify-center mb-6">
                        <img
                            src="/logo-pmpp.png"
                            alt="Logo PMPP"
                            className="h-24 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Sisinfo OPPD</h1>
                    <p className="text-gray-600 font-medium text-sm">Sistim Informasi Logistik OPPD TNI</p>
                </div>

                {/* Form */}
                <div className="p-8 pt-6">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center justify-center font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700 ml-1">Email / Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-300"
                                    placeholder="Masukkan email..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-300"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-primary to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk Sistem'}
                        </button>
                    </form>
                </div>

                <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
                    &copy; {new Date().getFullYear()} Logikai Studio. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Login;
