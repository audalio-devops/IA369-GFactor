import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import SimuladorForm from './components/SimuladorForm';
import GerarBordero from './components/GerarBordero';
import Configuracoes from './components/Configuracoes';
import Clientes from './components/Clientes';
import Login from './components/Login';
import { Bell, Clock, LayoutDashboard } from 'lucide-react';

// Retorna a saudação de acordo com o período do dia (horário local do navegador):
// 05h-11h59 = Bom dia, 12h-17h59 = Boa tarde, 18h-04h59 = Boa noite.
const getSaudacao = () => {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('ia369_authenticated') === 'true';
  });
  const [activeTab, setActiveTab] = useState('home');

  const handleLogout = () => {
    localStorage.removeItem('ia369_authenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gold text-wine selection:bg-wine selection:text-branco flex font-brutalist">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col relative z-10">
        {/* TECHNICAL GRID BACKGROUND OVERLAY */}
        <div className="fixed inset-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#4a100d 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        </div>

        {/* TOP BAR / HEADER */}
        <header className="border-b border-wine/10 p-4 flex justify-end items-center gap-6 relative z-20">
          <div className="flex items-center gap-2 text-[10px] font-mono text-wine font-bold">
            <Clock className="w-3 h-3 text-wine" />
            <span>Ciclo atual: Faltam 24 dias</span>
          </div>
          <div className="h-4 w-[1px] bg-wine/10" />
          <Bell className="w-4 h-4 text-wine/60 hover:text-wine cursor-pointer transition-colors" />
        </header>

        {/* CONTENT CONTAINER */}
        <main className="p-12 max-w-7xl relative z-20">

          {/* 0. HOME / DASHBOARD VIEW */}
          {activeTab === 'home' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="mb-12">
                <h2 className="text-5xl font-black font-mono tracking-tighter uppercase italic leading-none text-wine">
                  {getSaudacao()}, Operador(a)
                </h2>
                <div className="h-2 w-32 bg-wine mt-4 rounded-full" />
              </div>

              {/* STATS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="brutalist-card bg-wine">
                  <span className="text-[10px] uppercase font-black opacity-60 tracking-widest block mb-4 border-b border-white/10 pb-2 text-branco">
                    Volume operado no mês
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] uppercase opacity-50 mb-1 text-branco">Operado</p>
                      <p className="text-3xl font-mono text-gold font-black">R$ 306.092,00</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase opacity-50 mb-1 text-branco">Liquidado</p>
                      <p className="text-3xl font-mono text-gold font-black">R$ 523.984,80</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <p className="text-[9px] uppercase opacity-50 text-branco">Saldo de hoje</p>
                    <p className="text-xl font-mono text-branco font-black">- R$ 217.892,80</p>
                  </div>
                </div>

                <div className="brutalist-card bg-wine">
                  <span className="text-[10px] uppercase font-black opacity-60 tracking-widest block mb-4 border-b border-white/10 pb-2 text-branco">
                    Volume operado hoje
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[9px] uppercase opacity-50 mb-1 text-branco">Operado</p>
                      <p className="text-xl font-mono text-gold font-black">R$ 0,00</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase opacity-50 mb-1 text-branco">Liquidado</p>
                      <p className="text-xl font-mono text-gold font-black">R$ 0,00</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase opacity-50 mb-1 text-branco">Saldo hoje</p>
                      <p className="text-xl font-mono text-gold font-black">R$ 0,00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1. CALCULO VIEW */}
          {activeTab === 'simulate' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SimuladorForm />
            </div>
          )}

          {/* 2. OPERAÇÕES VIEW */}
          {activeTab === 'operacoes' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GerarBordero />
            </div>
          )}

          {/* 3. CONFIGURAÇÕES VIEW */}
          {activeTab === 'config' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Configuracoes />
            </div>
          )}

          {/* 4. CLIENTES VIEW */}
          {activeTab === 'clients' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Clientes />
            </div>
          )}

          {/* 5. UNDER CONSTRUCTION VIEWS */}
          {['monitor', 'marketing', 'tutorials', 'notifications'].includes(activeTab) && (
            <div className="brutalist-card border-dashed bg-wine/90 flex flex-col items-center justify-center py-48 gap-4 animate-in zoom-in-95 duration-300">
              <LayoutDashboard className="w-16 h-16 text-gold" />
              <div className="text-center">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-branco">Módulo em Desenvolvimento</h3>
                <p className="text-[10px] font-mono opacity-50 uppercase mt-2 text-branco">Acesso Restrito // Terminal_LOCKED</p>
              </div>
            </div>
          )}
        </main>

        <footer className="mt-auto p-12 border-t border-wine/10 opacity-50 font-mono text-[10px] flex justify-between uppercase relative z-20 text-wine">
          <span>IA369 GFACTOR COMMAND CENTER // TERMINAL_ID: 1029</span>
          <span>SECURE_BY_DEFAULT // 2026</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
