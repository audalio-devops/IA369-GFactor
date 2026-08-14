import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';

const SimuladorForm = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [params, setParams] = useState({
        valorFace: 10000,
        dataOperacao: today,
        dataVencimento: nextMonth,
        taxaMensal: 3.5,
        advaloremPercent: 0.5,
        tarifaBoleto: 5.0,
        iofFixo: 0.0038,
        iofDiario: 0.0000411,
        floatBancario: 1,
        contagemDiasUteis: false,
        tarifasCustomizadas: []
    });

    const [results, setResults] = useState({
        valorDesconto: 0,
        valorAdvalorem: 0,
        valorIofFixo: 0,
        valorIofDiario: 0,
        valorIofTotal: 0,
        valorTarifasCustomizadas: 0,
        valorLiquido: 0,
        custoTotalPercent: 0,
        prazoEfetivo: 30,
        vencimentoAjustado: nextMonth
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [taxasRes, customRes] = await Promise.all([
                    axios.get(`${API_URL}/settings/taxas`),
                    axios.get(`${API_URL}/settings/tarifas-custom`)
                ]);
                if (taxasRes.data.id) {
                    setParams(prev => ({
                        ...prev,
                        ...taxasRes.data,
                        tarifasCustomizadas: customRes.data
                    }));
                }
            } catch (error) {
                console.error("Erro ao carregar configurações", error);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const simulate = async () => {
            if (!params.dataVencimento || !params.dataOperacao) return;
            setLoading(true);
            try {
                const response = await axios.post(`${API_URL}/pricing/simulate`, params);
                setResults(response.data);
            } catch (error) {
                // Simplified Fallback logic
                const d1 = new Date(params.dataOperacao);
                const d2 = new Date(params.dataVencimento);
                const diffTime = Math.abs(d2 - d1);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + params.floatBancario;

                const fatorDiario = (params.taxaMensal / 100) / 30;
                const valorDesconto = params.valorFace * fatorDiario * diffDays;
                const valorAdvalorem = params.valorFace * (params.advaloremPercent / 100);
                const valorIofFixo = params.valorFace * params.iofFixo;
                const valorIofDiario = params.valorFace * params.iofDiario * diffDays;
                const valorIofTotal = valorIofFixo + valorIofDiario;
                // Espelha o backend: soma bruta das tarifas customizadas só é segura
                // aqui porque o simulador trata sempre UM único título (sem risco de
                // duplicação entre títulos de um borderô). Ver PricingEngine/BorderoService.
                const valorTarifasCustomizadas = (params.tarifasCustomizadas || [])
                    .reduce((sum, t) => sum + (t.valor || 0), 0);

                const valorLiquido = params.valorFace - valorDesconto - valorAdvalorem - valorIofTotal
                    - params.tarifaBoleto - valorTarifasCustomizadas;
                const custoTotal = ((params.valorFace - valorLiquido) / params.valorFace) * 100;

                setResults({
                    valorDesconto: valorDesconto.toFixed(2),
                    valorAdvalorem: valorAdvalorem.toFixed(2),
                    valorIofFixo: valorIofFixo.toFixed(2),
                    valorIofDiario: valorIofDiario.toFixed(2),
                    valorIofTotal: valorIofTotal.toFixed(2),
                    valorTarifasCustomizadas: valorTarifasCustomizadas.toFixed(2),
                    valorLiquido: valorLiquido.toFixed(2),
                    custoTotalPercent: custoTotal.toFixed(2),
                    prazoEfetivo: diffDays,
                    vencimentoAjustado: params.dataVencimento
                });
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(simulate, 300);
        return () => clearTimeout(timeoutId);
    }, [params]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setParams(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="border-b-4 border-matrix-orange pb-4">
                <h1 className="text-4xl font-black font-mono tracking-tighter uppercase italic">
                    Simulação de Operação
                </h1>
                <p className="text-matrix-orange font-mono text-sm uppercase">Engine de Cálculo V1.2 // FISCAL_ENABLED</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* INPUT SECTION */}
                <div className="brutalist-card space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col md:col-span-2">
                            <label className="text-xs uppercase font-bold mb-1">Valor de Face (R$)</label>
                            <input
                                type="number"
                                name="valorFace"
                                value={params.valorFace}
                                onChange={handleChange}
                                className="brutalist-input text-2xl font-black text-matrix-orange"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs uppercase font-bold mb-1">Data Operação</label>
                            <input
                                type="date"
                                name="dataOperacao"
                                value={params.dataOperacao}
                                onChange={handleChange}
                                className="brutalist-input text-sm"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs uppercase font-bold mb-1">Data Vencimento</label>
                            <input
                                type="date"
                                name="dataVencimento"
                                value={params.dataVencimento}
                                onChange={handleChange}
                                className="brutalist-input text-sm"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs uppercase font-bold mb-1">Taxa Mensal (%)</label>
                            <input
                                type="number"
                                name="taxaMensal"
                                step="0.01"
                                value={params.taxaMensal}
                                onChange={handleChange}
                                className="brutalist-input text-xl"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs uppercase font-bold mb-1">Advalorem (%)</label>
                            <input
                                type="number"
                                name="advaloremPercent"
                                step="0.01"
                                value={params.advaloremPercent}
                                onChange={handleChange}
                                className="brutalist-input text-xl"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs uppercase font-bold mb-1">Tarifa Boleto (R$)</label>
                            <input
                                type="number"
                                name="tarifaBoleto"
                                value={params.tarifaBoleto}
                                onChange={handleChange}
                                className="brutalist-input text-xl"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs uppercase font-bold mb-1">Float (Dias)</label>
                            <input
                                type="number"
                                name="floatBancario"
                                value={params.floatBancario}
                                onChange={handleChange}
                                className="brutalist-input text-xl"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs uppercase font-bold mb-1">IOF Fixo (%)</label>
                            <input
                                type="number"
                                name="iofFixo"
                                step="0.0001"
                                value={params.iofFixo}
                                onChange={handleChange}
                                className="brutalist-input text-xs"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs uppercase font-bold mb-1">IOF Diário (%)</label>
                            <input
                                type="number"
                                name="iofDiario"
                                step="0.0000001"
                                value={params.iofDiario}
                                onChange={handleChange}
                                className="brutalist-input text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* OUTPUT SECTION */}
                <div className="space-y-4">
                    <div className="p-6 border border-white bg-matrix-orange shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:scale-[1.01] transition-transform duration-200">
                        <span className="text-xs uppercase font-black text-black block mb-1">
                            Valor Líquido a Receber
                        </span>
                        <div className="text-5xl font-black font-mono text-black">
                            R$ {Number(results.valorLiquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] font-mono text-black uppercase font-bold">
                            <span>Prazo Efetivo: {results.prazoEfetivo} dias</span>
                            <span>Venc: {results.vencimentoAjustado ? results.vencimentoAjustado.split('-').reverse().join('/') : '--/--/----'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="brutalist-card">
                            <span className="text-xs uppercase font-bold opacity-70">Deságio (Juros)</span>
                            <div className="text-2xl font-mono text-matrix-orange">
                                R$ {Number(results.valorDesconto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[9px] opacity-40 font-mono italic">Inclui {params.floatBancario} dias de float</div>
                        </div>
                        <div className="brutalist-card">
                            <span className="text-xs uppercase font-bold opacity-70">Desconto Advalorem</span>
                            <div className="text-2xl font-mono text-white">
                                R$ {Number(results.valorAdvalorem).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="brutalist-card">
                            <span className="text-xs uppercase font-bold opacity-70">IOF Total</span>
                            <div className="text-2xl font-mono text-matrix-green">
                                R$ {Number(results.valorIofTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[9px] opacity-40 font-mono">
                                F: {results.valorIofFixo} / D: {results.valorIofDiario}
                            </div>
                        </div>
                        <div className="brutalist-card">
                            <span className="text-xs uppercase font-bold opacity-70">Taxas Extras</span>
                            <div className="text-2xl font-mono text-white">
                                R$ {Number(results.valorTarifasCustomizadas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[9px] opacity-40 font-mono">
                                {params.tarifasCustomizadas?.length || 0} tarifas aplicadas
                            </div>
                        </div>
                        <div className="brutalist-card">
                            <span className="text-xs uppercase font-bold opacity-70">Custo Efetivo</span>
                            <div className="text-2xl font-mono text-white">
                                {results.custoTotalPercent}%
                            </div>
                        </div>
                    </div>

                    {params.tarifasCustomizadas?.length > 0 && (
                        <div className="bg-matrix-black/50 border border-white/5 p-3 space-y-1">
                            <p className="text-[9px] font-black uppercase opacity-30 mb-2">Detalhamento de Tarifas</p>
                            {params.tarifasCustomizadas.map((t, i) => (
                                <div key={i} className="flex justify-between text-[10px] font-mono">
                                    <span className="opacity-60">{t.nome} ({t.tipoCobranca})</span>
                                    <span className="text-matrix-orange">R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="p-4 border-2 border-dashed border-matrix-orange opacity-50 font-mono text-[10px] uppercase">
                        Cálculo considera Feriados de 2026 e RoundingMode.HALF_UP (arredondamento comercial)
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimuladorForm;
