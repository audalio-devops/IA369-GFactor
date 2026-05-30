import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import SimuladorForm from './components/SimuladorForm';
import XmlUploader from './components/XmlUploader';
import Configuracoes from './components/Configuracoes';
import { Bell, Clock, LayoutDashboard } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-matrix-black text-white selection:bg-matrix-orange selection:text-black flex font-brutalist">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col relative z-10">
        {/* TECHNICAL GRID BACKGROUND OVERLAY */}
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        </div>

        {/* TOP BAR / HEADER */}
        <header className="bg-matrix-green/5 border-b border-white/5 p-4 flex justify-end items-center gap-6 relative z-20">
          <div className="flex items-center gap-2 text-[10px] font-mono text-matrix-green font-bold">
            <Clock className="w-3 h-3" />
            <span>Ciclo atual: Faltam 24 dias</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <Bell className="w-4 h-4 text-white/50 hover:text-matrix-orange cursor-pointer transition-colors" />
        </header>

        {/* CONTENT CONTAINER */}
        <main className="p-12 max-w-7xl relative z-20">

          {/* 0. HOME / DASHBOARD VIEW */}
          {activeTab === 'home' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="mb-12">
                <h2 className="text-5xl font-black font-mono tracking-tighter uppercase italic leading-none">
                  Boa noite, Luiz
                </h2>
                <div className="h-2 w-32 bg-matrix-orange mt-4" />
              </div>

              {/* STATS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="brutalist-card bg-matrix-gray/40">
                  <span className="text-[10px] uppercase font-black opacity-50 tracking-widest block mb-4 border-b border-white/5 pb-2">
                    Volume operado no mês
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] uppercase opacity-40 mb-1">Operado</p>
                      <p className="text-3xl font-mono text-matrix-green font-black">R$ 306.092,00</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase opacity-40 mb-1">Liquidado</p>
                      <p className="text-3xl font-mono text-matrix-green font-black">R$ 523.984,80</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <p className="text-[9px] uppercase opacity-40">Saldo de hoje</p>
                    <p className="text-xl font-mono text-white font-black">- R$ 217.892,80</p>
                  </div>
                </div>

                <div className="brutalist-card bg-matrix-gray/40">
                  <span className="text-[10px] uppercase font-black opacity-50 tracking-widest block mb-4 border-b border-white/5 pb-2">
                    Volume operado hoje
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[9px] uppercase opacity-40 mb-1">Operado</p>
                      <p className="text-xl font-mono text-matrix-orange font-black">R$ 0,00</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase opacity-40 mb-1">Liquidado</p>
                      <p className="text-xl font-mono text-matrix-orange font-black">R$ 0,00</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase opacity-40 mb-1">Saldo hoje</p>
                      <p className="text-xl font-mono text-matrix-orange font-black">R$ 0,00</p>
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
              <XmlUploader />
            </div>
          )}

          {/* 3. CONFIGURAÇÕES VIEW */}
          {activeTab === 'config' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Configuracoes />
            </div>
          )}

          {/* 4. UNDER CONSTRUCTION VIEWS */}
          {['clients', 'monitor', 'marketing', 'tutorials', 'notifications'].includes(activeTab) && (
            <div className="brutalist-card border-dashed opacity-40 flex flex-col items-center justify-center py-48 gap-4 animate-in zoom-in-95 duration-300">
              <LayoutDashboard className="w-16 h-16 text-matrix-orange" />
              <div className="text-center">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Módulo em Desenvolvimento</h3>
                <p className="text-[10px] font-mono opacity-50 uppercase mt-2">Acesso Restrito // Terminal_LOCKED</p>
              </div>
            </div>
          )}
        </main>

        <footer className="mt-auto p-12 border-t border-white/10 opacity-30 font-mono text-[10px] flex justify-between uppercase relative z-20">
          <span>IA369 GFACTOR COMMAND CENTER // TERMINAL_ID: 1029</span>
          <span>SECURE_BY_DEFAULT // 2026</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
