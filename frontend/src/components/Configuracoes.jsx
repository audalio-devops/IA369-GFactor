import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Plus, Trash2, Settings as SettingsIcon, Info } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';

const Configuracoes = () => {
    const [taxas, setTaxas] = useState({
        taxaMensal: 0,
        advaloremPercent: 0,
        tarifaBoleto: 0,
        iofFixo: 0,
        iofDiario: 0,
        floatBancario: 1
    });

    const [tarifasCustom, setTarifasCustom] = useState([]);
    const [newTarifa, setNewTarifa] = useState({ nome: '', valor: 0, tipoCobranca: 'BORDERÔ' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [taxasRes, customRes] = await Promise.all([
                axios.get(`${API_URL}/settings/taxas`),
                axios.get(`${API_URL}/settings/tarifas-custom`)
            ]);
            if (taxasRes.data.id) setTaxas(taxasRes.data);
            setTarifasCustom(customRes.data);
        } catch (error) {
            console.error("Erro ao buscar configurações", error);
        }
    };

    const handleTaxaChange = (e) => {
        const { name, value } = e.target;
        setTaxas(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const saveTaxas = async () => {
        setLoading(true);
        try {
            await axios.post(`${API_URL}/settings/taxas`, taxas);
            setMessage({ type: 'success', text: 'Taxas padrão atualizadas!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao salvar taxas.' });
        } finally {
            setLoading(false);
        }
    };

    const addTarifaCustom = async () => {
        if (!newTarifa.nome || newTarifa.valor <= 0) return;
        try {
            const res = await axios.post(`${API_URL}/settings/tarifas-custom`, newTarifa);
            setTarifasCustom(prev => [...prev, res.data]);
            setNewTarifa({ nome: '', valor: 0, tipoCobranca: 'BORDERÔ' });
        } catch (error) {
            console.error("Erro ao adicionar tarifa", error);
        }
    };

    const deleteTarifaCustom = async (id) => {
        try {
            await axios.delete(`${API_URL}/settings/tarifas-custom/${id}`);
            setTarifasCustom(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error("Erro ao deletar tarifa", error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="border-b-4 border-matrix-orange pb-4">
                <h1 className="text-4xl font-black font-mono tracking-tighter uppercase italic">
                    Configurações do Sistema
                </h1>
                <p className="text-matrix-orange font-mono text-sm uppercase">Painel de Controle Financeiro</p>
            </header>

            {message && (
                <div className={`p-4 font-bold uppercase text-xs ${message.type === 'success' ? 'bg-matrix-green text-black' : 'bg-red-500 text-white'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* GRUPO: TARIFAS PADRÃO */}
                <section className="space-y-6">
                    <div className="brutalist-card">
                        <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                            <SettingsIcon className="w-5 h-5 text-matrix-orange" />
                            Tarifas Padrão (Imutáveis)
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase font-bold opacity-50">Taxa Mensal (%)</label>
                                <input type="number" name="taxaMensal" value={taxas.taxaMensal} onChange={handleTaxaChange} className="brutalist-input" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase font-bold opacity-50">Advalorem (%)</label>
                                <input type="number" name="advaloremPercent" value={taxas.advaloremPercent} onChange={handleTaxaChange} className="brutalist-input" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase font-bold opacity-50">Tarifa Boleto (R$)</label>
                                <input type="number" name="tarifaBoleto" value={taxas.tarifaBoleto} onChange={handleTaxaChange} className="brutalist-input" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase font-bold opacity-50">IOF Fixo (%)</label>
                                <input type="number" name="iofFixo" value={taxas.iofFixo} step="0.0001" onChange={handleTaxaChange} className="brutalist-input" />
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-[10px] uppercase font-bold opacity-50">IOF Diário (%)</label>
                                <input type="number" name="iofDiario" value={taxas.iofDiario} step="0.0000001" onChange={handleTaxaChange} className="brutalist-input" />
                            </div>
                        </div>

                        <button
                            onClick={saveTaxas}
                            disabled={loading}
                            className="mt-8 brutalist-button w-full flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Salvar Configurações Base
                        </button>
                    </div>

                    <div className="brutalist-card border-matrix-green/30 shadow-[4px_4px_0px_0px_rgba(0,255,65,0.3)]">
                        <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2 text-matrix-green">
                            <Info className="w-5 h-5" />
                            Configurações Gerais
                        </h2>
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold opacity-50">Float Bancário (Dias)</label>
                            <input type="number" name="floatBancario" value={taxas.floatBancario} onChange={handleTaxaChange} className="brutalist-input text-matrix-green text-2xl" />
                            <p className="text-[9px] opacity-40 mt-2 italic font-mono uppercase">Dias adicionais somados ao vencimento para cálculo de juros.</p>
                        </div>
                    </div>
                </section>

                {/* GRUPO: TARIFAS DINÂMICAS */}
                <section className="space-y-6">
                    <div className="brutalist-card">
                        <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-matrix-orange" />
                            Tarifas Customizadas
                        </h2>

                        <div className="space-y-4 mb-8">
                            <div className="grid grid-cols-1 gap-4">
                                <input
                                    placeholder="NOME DA TARIFA"
                                    className="brutalist-input"
                                    value={newTarifa.nome}
                                    onChange={e => setNewTarifa({ ...newTarifa, nome: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="VALOR (R$)"
                                        className="brutalist-input"
                                        value={newTarifa.valor}
                                        onChange={e => setNewTarifa({ ...newTarifa, valor: parseFloat(e.target.value) || 0 })}
                                    />
                                    <select
                                        className="brutalist-input text-[10px] uppercase font-bold"
                                        value={newTarifa.tipoCobranca}
                                        onChange={e => setNewTarifa({ ...newTarifa, tipoCobranca: e.target.value })}
                                    >
                                        <option value="BORDERÔ">Por Borderô</option>
                                        <option value="NOTA_FISCAL">Por Nota Fiscal</option>
                                        <option value="TITULO">Por Título</option>
                                    </select>
                                </div>
                                <button onClick={addTarifaCustom} className="brutalist-button bg-white text-black hover:bg-matrix-orange transition-colors uppercase font-black text-xs py-3">
                                    Adicionar Nova Tarifa
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {tarifasCustom.map(tarifa => (
                                <div key={tarifa.id} className="flex justify-between items-center bg-matrix-black p-3 border border-white/5 group hover:border-matrix-orange transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-matrix-orange">{tarifa.nome}</span>
                                        <span className="text-[9px] opacity-40 font-mono italic uppercase">{tarifa.tipoCobranca}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono font-bold text-white">R$ {tarifa.valor.toFixed(2)}</span>
                                        <button onClick={() => deleteTarifaCustom(tarifa.id)} className="text-white/20 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {tarifasCustom.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-white/5 opacity-20 uppercase font-black text-xs">
                                    Nenhuma tarifa adicional cadastrada
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Configuracoes;
