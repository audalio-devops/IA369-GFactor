import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Plus, Trash2, Settings as SettingsIcon, Info } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8369/api';

const Configuracoes = () => {
    const [taxas, setTaxas] = useState({
        taxaMensal: 0,
        advaloremPercent: 0,
        tarifaBoleto: 0,
        iofFixo: 0,
        iofDiario: 0,
        floatBancario: 2,
        contagemDiasUteis: false
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
            <header className="border-b border-wine/10 pb-4">
                <h1 className="text-4xl font-black font-mono tracking-tighter uppercase italic text-wine">
                    Configurações do Sistema
                </h1>
                <p className="text-wine/60 font-mono text-sm uppercase">Painel de Controle Financeiro</p>
            </header>

            {message && (
                <div className={`p-4 font-bold uppercase text-xs rounded-xl border ${message.type === 'success' ? 'bg-wine text-gold border-gold/20' : 'bg-red-500/15 text-red-300 border-red-500/20'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* GRUPO: TARIFAS PADRÃO */}
                <section className="space-y-6">
                    <div className="brutalist-card bg-wine text-branco">
                        <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2 text-branco">
                            <SettingsIcon className="w-5 h-5 text-gold" />
                            Tarifas Padrão (Imutáveis)
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase font-bold opacity-60 text-branco mb-1">Taxa Mensal (%)</label>
                                <input type="number" name="taxaMensal" value={taxas.taxaMensal} onChange={handleTaxaChange} className="brutalist-input" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase font-bold opacity-60 text-branco mb-1">Advalorem (%)</label>
                                <input type="number" name="advaloremPercent" value={taxas.advaloremPercent} onChange={handleTaxaChange} className="brutalist-input" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase font-bold opacity-60 text-branco mb-1">Tarifa Boleto (R$)</label>
                                <input type="number" name="tarifaBoleto" value={taxas.tarifaBoleto} onChange={handleTaxaChange} className="brutalist-input" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase font-bold opacity-60 text-branco mb-1">IOF Fixo (%)</label>
                                <input type="number" name="iofFixo" value={taxas.iofFixo} step="0.0001" onChange={handleTaxaChange} className="brutalist-input" />
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-[10px] uppercase font-bold opacity-60 text-branco mb-1">IOF Diário (%)</label>
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

                    <div className="brutalist-card bg-wine text-branco border-white/10 shadow-[0_8px_30px_rgba(74,16,13,0.15)]">
                        <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2 text-gold">
                            <Info className="w-5 h-5" />
                            Configurações Gerais
                        </h2>
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold opacity-60 text-branco mb-1">Float Bancário (Dias)</label>
                            <input type="number" name="floatBancario" value={taxas.floatBancario} onChange={handleTaxaChange} className="brutalist-input text-gold text-2xl font-bold" />
                            <p className="text-[9px] opacity-55 mt-2 italic font-mono uppercase text-branco">Dias adicionais somados ao vencimento (aplicados após o ajuste para o próximo dia útil), para cálculo de juros.</p>
                        </div>

                        <div className="flex flex-col mt-6">
                            <label className="text-[10px] uppercase font-bold opacity-60 text-branco mb-1">Contagem de Prazo</label>
                            <select
                                name="contagemDiasUteis"
                                value={taxas.contagemDiasUteis ? 'uteis' : 'corridos'}
                                onChange={e => setTaxas(prev => ({ ...prev, contagemDiasUteis: e.target.value === 'uteis' }))}
                                className="brutalist-input text-gold font-bold"
                            >
                                <option value="corridos" className="bg-wine text-branco">Dias Corridos</option>
                                <option value="uteis" className="bg-wine text-branco">Dias Úteis</option>
                            </select>
                            <p className="text-[9px] opacity-55 mt-2 italic font-mono uppercase text-branco">Define se o prazo (deságio/IOF) é contado em dias corridos ou apenas dias úteis.</p>
                        </div>
                    </div>
                </section>

                {/* GRUPO: TARIFAS DINÂMICAS */}
                <section className="space-y-6">
                    <div className="brutalist-card bg-wine text-branco">
                        <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2 text-branco">
                            <Plus className="w-5 h-5 text-gold" />
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
                                        <option value="BORDERÔ" className="bg-wine text-branco">Por Borderô</option>
                                        <option value="NOTA_FISCAL" className="bg-wine text-branco">Por Nota Fiscal</option>
                                        <option value="TITULO" className="bg-wine text-branco">Por Título</option>
                                    </select>
                                </div>
                                <button onClick={addTarifaCustom} className="brutalist-button bg-white text-wine hover:bg-white/95 transition-all w-full uppercase font-black text-xs py-3 rounded-xl">
                                    Adicionar Nova Tarifa
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {tarifasCustom.map(tarifa => (
                                <div key={tarifa.id} className="flex justify-between items-center bg-wine/30 p-3 rounded-xl border border-white/10 group hover:border-gold transition-all text-branco">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-gold">{tarifa.nome}</span>
                                        <span className="text-[9px] opacity-50 font-mono italic uppercase text-branco">{tarifa.tipoCobranca}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono font-bold text-branco">R$ {tarifa.valor.toFixed(2)}</span>
                                        <button onClick={() => deleteTarifaCustom(tarifa.id)} className="text-branco/30 hover:text-red-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {tarifasCustom.length === 0 && (
                                <div className="text-center py-8 border border-dashed border-white/20 opacity-30 uppercase font-black text-xs text-branco rounded-xl">
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
