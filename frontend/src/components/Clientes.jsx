import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8369/api'}/cedentes`;

const Clientes = () => {
    const { showToast } = useToast();
    const [cedentes, setCedentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showInactive, setShowInactive] = useState(false);

    const [formData, setFormData] = useState({
        razao_social: '',
        cnpj: '',
        taxaPadraoDesagio: 0,
        faturamentoAnual: 0,
        enderecoCompleto: '',
        contatoNome: '',
        contatoTelefoneFixo: '',
        contatoCelular: '',
        contatoEmail: '',
        ativo: true,
        versao: 0
    });

    useEffect(() => {
        fetchCedentes();
    }, [showInactive]);

    const fetchCedentes = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}?incluirInativos=${showInactive}`);
            if (!res.ok) throw new Error('Erro ao carregar clientes');
            const data = await res.json();
            setCedentes(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `${API_URL}/${editingId}` : API_URL;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Erro ao salvar cliente');
            }

            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                razao_social: '',
                cnpj: '',
                taxaPadraoDesagio: 0,
                faturamentoAnual: 0,
                enderecoCompleto: '',
                contatoNome: '',
                contatoTelefoneFixo: '',
                contatoCelular: '',
                contatoEmail: '',
                ativo: true,
                versao: 0
            });
            fetchCedentes();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleEdit = (cedente) => {
        setEditingId(cedente.id);
        setFormData({
            razao_social: cedente.razao_social,
            cnpj: cedente.cnpj,
            taxaPadraoDesagio: cedente.taxaPadraoDesagio,
            faturamentoAnual: cedente.faturamentoAnual || 0,
            enderecoCompleto: cedente.enderecoCompleto || '',
            contatoNome: cedente.contatoNome || '',
            contatoTelefoneFixo: cedente.contatoTelefoneFixo || '',
            contatoCelular: cedente.contatoCelular || '',
            contatoEmail: cedente.contatoEmail || '',
            ativo: cedente.ativo,
            versao: cedente.versao
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deseja realmente desativar este cliente?')) return;

        try {
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Erro ao desativar cliente');
            fetchCedentes();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const filteredCedentes = cedentes.filter(c =>
        c.razao_social.toLowerCase().includes(search.toLowerCase()) ||
        c.cnpj.includes(search)
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div>
                    <h2 className="text-5xl font-black font-mono tracking-tighter uppercase italic leading-none flex items-center gap-4">
                        Gerenciamento de Clientes
                        <span className="text-matrix-orange text-lg not-italic">/ CEDENTES</span>
                    </h2>
                    <div className="h-2 w-48 bg-matrix-green mt-4" />
                </div>

                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="hidden"
                        />
                        <div className={`w-4 h-4 border-2 transition-colors ${showInactive ? 'bg-matrix-orange border-matrix-orange' : 'border-white/20 group-hover:border-matrix-orange'}`} />
                        <span className="text-[10px] uppercase font-black opacity-50 group-hover:opacity-100 tracking-widest transition-opacity">
                            Mostrar Inativos
                        </span>
                    </label>

                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                razao_social: '',
                                cnpj: '',
                                taxaPadraoDesagio: 0,
                                faturamentoAnual: 0,
                                enderecoCompleto: '',
                                contatoNome: '',
                                contatoTelefoneFixo: '',
                                contatoCelular: '',
                                contatoEmail: '',
                                ativo: true,
                                versao: 0
                            });
                            setIsModalOpen(true);
                        }}
                        className="brutalist-button py-3 px-8 bg-matrix-orange text-black flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                        <UserPlus className="w-5 h-5" />
                        ADICIONAR NOVO CEDENTE
                    </button>
                </div>
            </div>

            {/* SEARCH AND FILTER */}
            <div className="mb-8 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-matrix-green/50 group-focus-within:text-matrix-orange transition-colors" />
                <input
                    type="text"
                    placeholder="PESQUISAR POR RAZÃO SOCIAL OU CNPJ..."
                    className="w-full bg-matrix-gray/20 border-2 border-white/10 p-4 pl-12 font-mono text-sm focus:border-matrix-orange outline-none transition-all placeholder:text-white/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* DATA TABLE */}
            <div className="brutalist-card bg-matrix-gray/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 uppercase text-xs font-black opacity-50 tracking-widest">
                                <th className="p-4">Razão Social</th>
                                <th className="p-4">CNPJ</th>
                                <th className="p-4 text-center">Taxa Padrão (%)</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-sm">
                            {loading ? (
                                <tr><td colSpan="5" className="p-12 text-center animate-pulse">CARREGANDO DADOS DO TERMINAL...</td></tr>
                            ) : filteredCedentes.length === 0 ? (
                                <tr><td colSpan="5" className="p-12 text-center opacity-30 italic">NENHUM CEDENTE ENCONTRADO NO SISTEMA.</td></tr>
                            ) : (
                                filteredCedentes.map((cedente) => (
                                    <tr key={cedente.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="p-4 font-bold">{cedente.razao_social}</td>
                                        <td className="p-4 opacity-70">{cedente.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}</td>
                                        <td className="p-4 text-center text-matrix-green font-black">
                                            {cedente.taxaPadraoDesagio.toFixed(2)}%
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center">
                                                {cedente.ativo ?
                                                    <span className="text-[10px] bg-matrix-green/20 text-matrix-green px-2 py-1 rounded-full font-black border border-matrix-green/50">ATIVO</span> :
                                                    <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded-full font-black border border-red-500/50">INATIVO</span>
                                                }
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(cedente)}
                                                    className="p-2 hover:bg-matrix-orange hover:text-black transition-all rounded border border-white/5"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cedente.id)}
                                                    className="p-2 hover:bg-red-600 hover:text-white transition-all rounded border border-white/5"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

                    <div className="brutalist-card bg-matrix-black border-matrix-orange max-w-xl w-full relative z-[110] animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <h3 className="text-3xl font-black font-mono tracking-tighter uppercase mb-4 border-b border-white/5 pb-4 shrink-0">
                            {editingId ? 'Editar Cedente' : 'Novo Cedente'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black opacity-50 tracking-widest block">Razão Social</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-matrix-gray/40 border border-white/10 p-3 font-mono outline-none focus:border-matrix-orange"
                                    value={formData.razao_social}
                                    onChange={e => setFormData({ ...formData, razao_social: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black opacity-50 tracking-widest block">CNPJ (APENAS NÚMEROS)</label>
                                <input
                                    required
                                    maxLength="14"
                                    type="text"
                                    className="w-full bg-matrix-gray/40 border border-white/10 p-3 font-mono outline-none focus:border-matrix-orange"
                                    value={formData.cnpj}
                                    onChange={e => setFormData({ ...formData, cnpj: e.target.value.replace(/\D/g, '') })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black opacity-50 tracking-widest block">Taxa Padrão de Deságio (% a.m.)</label>
                                    <input
                                        required
                                        step="0.01"
                                        type="number"
                                        className="w-full bg-matrix-gray/40 border border-white/10 p-3 font-mono outline-none focus:border-matrix-orange"
                                        value={formData.taxaPadraoDesagio}
                                        onChange={e => setFormData({ ...formData, taxaPadraoDesagio: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black opacity-50 tracking-widest block">Faturamento Anual (Valor)</label>
                                    <input
                                        required
                                        step="0.01"
                                        type="number"
                                        className="w-full bg-matrix-gray/40 border border-white/10 p-3 font-mono outline-none focus:border-matrix-orange"
                                        value={formData.faturamentoAnual}
                                        onChange={e => setFormData({ ...formData, faturamentoAnual: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black opacity-50 tracking-widest block">Endereço Completo</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-matrix-gray/40 border border-white/10 p-3 font-mono outline-none focus:border-matrix-orange"
                                    value={formData.enderecoCompleto}
                                    onChange={e => setFormData({ ...formData, enderecoCompleto: e.target.value })}
                                />
                            </div>

                            <div className="border-t border-white/5 pt-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-matrix-orange mb-4">Informações de Contato</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] uppercase font-black opacity-50 tracking-widest block">Nome do Contato</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-matrix-gray/40 border border-white/10 p-3 font-mono outline-none focus:border-matrix-orange"
                                            value={formData.contatoNome}
                                            onChange={e => setFormData({ ...formData, contatoNome: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black opacity-50 tracking-widest block">Tel Fixo</label>
                                        <input
                                            type="text"
                                            className="w-full bg-matrix-gray/40 border border-white/10 p-3 font-mono outline-none focus:border-matrix-orange"
                                            value={formData.contatoTelefoneFixo}
                                            onChange={e => setFormData({ ...formData, contatoTelefoneFixo: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black opacity-50 tracking-widest block">Celular</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-matrix-gray/40 border border-white/10 p-3 font-mono outline-none focus:border-matrix-orange"
                                            value={formData.contatoCelular}
                                            onChange={e => setFormData({ ...formData, contatoCelular: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] uppercase font-black opacity-50 tracking-widest block">Email</label>
                                        <input
                                            required
                                            type="email"
                                            className="w-full bg-matrix-gray/40 border border-white/10 p-3 font-mono outline-none focus:border-matrix-orange"
                                            value={formData.contatoEmail}
                                            onChange={e => setFormData({ ...formData, contatoEmail: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 py-2">
                                <div
                                    onClick={() => setFormData({ ...formData, ativo: !formData.ativo })}
                                    className={`w-12 h-6 flex items-center p-1 cursor-pointer transition-colors ${formData.ativo ? 'bg-matrix-green' : 'bg-matrix-gray/40 border border-white/10'}`}
                                >
                                    <div className={`w-4 h-4 bg-white transition-transform ${formData.ativo ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-[10px] uppercase font-black opacity-70 tracking-widest">
                                    Status: {formData.ativo ? 'ATIVO' : 'INATIVO'}
                                </span>
                            </div>

                            <div className="flex gap-4 pt-6 sticky bottom-0 bg-matrix-black pb-2 mt-auto border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setIsModalOpen(false); }}
                                    className="flex-1 brutalist-button bg-matrix-gray/20 border-white/20 text-white/50 hover:bg-white/5 hover:text-white"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 brutalist-button bg-matrix-orange text-black font-black"
                                >
                                    SALVAR
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clientes;
