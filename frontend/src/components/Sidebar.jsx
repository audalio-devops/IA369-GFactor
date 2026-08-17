import React from 'react';
import { Home, FileText, Users, BarChart3, Settings, LogOut, LayoutDashboard, Share2, PlayCircle, Bell } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
    const mainLinks = [
        { id: 'home', label: 'Início', icon: LayoutDashboard },
        { id: 'simulate', label: 'Cálculo', icon: Home },
        { id: 'operacoes', label: 'Operações', icon: FileText },
        { id: 'config', label: 'Configurações', icon: Settings },
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'monitor', label: 'Monitor de Gestão', icon: BarChart3 },
    ];

    const extraLinks = [
        { id: 'marketing', label: 'Materiais de Marketing', icon: Share2 },
        { id: 'tutorials', label: 'Vídeos Tutoriais', icon: PlayCircle },
        { id: 'notifications', label: 'Notificações', icon: Bell },
    ];

    return (
        <aside className="w-64 h-screen bg-wine border-r border-gold/10 flex flex-col fixed left-0 top-0 z-50 text-branco">
            {/* LOGO AREA */}
            <div className="p-8 border-b border-white/5 mb-4 bg-black/10">
                <div className="text-3xl font-black font-mono tracking-tighter italic text-branco flex flex-col leading-none">
                    <span>IA369</span>
                    <span className="text-gold">GFACTOR</span>
                </div>
                <div className="text-[10px] font-mono mt-2 opacity-50 uppercase tracking-widest text-gold">
                    SYSTEM_STABLE_V1
                </div>
            </div>

            {/* MAIN NAVIGATION */}
            <nav className="flex-1 px-4 space-y-1">
                {mainLinks.map((link) => (
                    <button
                        key={link.id}
                        onClick={() => setActiveTab(link.id)}
                        className={`
                            w-full flex items-center gap-4 px-4 py-3 text-xs uppercase font-bold tracking-widest transition-all group rounded-xl
                            ${activeTab === link.id
                                ? 'bg-gold text-wine font-black translate-x-1 shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                                : 'text-branco/60 hover:text-branco hover:bg-white/5'}
                        `}
                    >
                        <link.icon className={`w-5 h-5 ${activeTab === link.id ? 'text-wine' : 'text-gold'}`} />
                        {link.label}
                    </button>
                ))}

                <div className="pt-8 pb-2">
                    <span className="px-4 text-[10px] font-black uppercase opacity-30 tracking-tighter">Conteúdos</span>
                </div>

                {extraLinks.map((link) => (
                    <button
                        key={link.id}
                        className="w-full flex items-center gap-4 px-4 py-3 text-[11px] uppercase font-bold text-branco/50 hover:text-branco hover:bg-white/5 rounded-xl transition-all"
                    >
                        <link.icon className="w-4 h-4" />
                        {link.label}
                    </button>
                ))}
            </nav>

            {/* USER FOOTER */}
            <div className="p-4 border-t border-white/5 bg-black/10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gold flex items-center justify-center font-black text-wine rounded-xl">
                        LZ
                    </div>
                    <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-branco">Luiz Silva</div>
                        <div className="text-[10px] text-gold/80 font-mono opacity-80">Admin_9982</div>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full text-left text-[10px] uppercase font-black opacity-30 hover:opacity-100 flex items-center gap-2 transition-opacity text-branco cursor-pointer"
                >
                    <LogOut className="w-3 h-3 text-gold" />
                    Sair do Terminal
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
