import { Bell, Search, UserCircle } from 'lucide-react';

const Header = () => {
    return (
        <header className="h-16 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10 border-b border-gray-100">
            <div className="flex items-center w-full max-w-md">
                <div className="relative w-full">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-text" />
                    </span>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border-none rounded-full leading-5 bg-gray-100 text-text placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                        placeholder="Type to search..."
                    />
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 relative">
                    <Bell className="h-6 w-6" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                </button>

                <div className="flex items-center space-x-3 border-l pl-4 border-gray-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-700">Admin Satgas</p>
                        <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                    <UserCircle className="h-8 w-8 text-gray-400" />
                </div>
            </div>
        </header>
    );
};

export default Header;
