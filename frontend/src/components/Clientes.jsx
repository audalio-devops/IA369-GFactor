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
                    <h2 className="text-5xl font-black font-mono tracking-tighter uppercase italic leading-none flex items-center gap-4 text-wine">
                        Gerenciamento de Clientes
                        <span className="text-wine/60 text-lg not-italic font-black">/ CEDENTES</span>
                    </h2>
                    <div className="h-2 w-48 bg-wine mt-4 rounded-full" />
                </div>

                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="hidden"
                        />
                        <div className={`w-4 h-4 border-2 transition-colors rounded ${showInactive ? 'bg-wine border-wine' : 'border-wine/20 group-hover:border-wine'}`} />
                        <span className="text-[10px] uppercase font-black opacity-60 group-hover:opacity-100 tracking-widest transition-opacity text-wine">
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
                        className="bg-wine text-branco hover:bg-wine/90 hover:scale-[1.02] active:scale-[0.98] font-bold py-3 px-8 rounded-xl transition-all shadow-[0_4px_12px_rgba(74,16,13,0.15)] flex items-center gap-2 text-xs uppercase tracking-wider"
                    >
                        <UserPlus className="w-5 h-5 text-gold" />
                        ADICIONAR NOVO CEDENTE
                    </button>
                </div>
            </div>

            {/* SEARCH AND FILTER */}
            <div className="mb-8 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-wine/50 group-focus-within:text-wine transition-colors" />
                <input
                    type="text"
                    placeholder="PESQUISAR POR RAZÃO SOCIAL OU CNPJ..."
                    className="w-full bg-wine/5 border border-wine/20 p-4 pl-12 rounded-xl font-mono text-sm focus:border-wine focus:outline-none transition-all placeholder:text-wine/40 text-wine"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* DATA TABLE */}
            <div className="brutalist-card bg-wine overflow-hidden shadow-[0_8px_30px_rgba(74,16,13,0.15)] p-0">
                <div className="overflow-x-auto p-6">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 uppercase text-xs font-black opacity-60 tracking-widest text-branco">
                                <th className="pb-4 pr-4">Razão Social</th>
                                <th className="pb-4 px-4">CNPJ</th>
                                <th className="pb-4 px-4 text-center">Taxa Padrão (%)</th>
                                <th className="pb-4 px-4 text-center">Status</th>
                                <th className="pb-4 pl-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-sm text-branco/90">
                            {loading ? (
                                <tr><td colSpan="5" className="p-12 text-center animate-pulse text-branco">CARREGANDO DADOS DO TERMINAL...</td></tr>
                            ) : filteredCedentes.length === 0 ? (
                                <tr><td colSpan="5" className="p-12 text-center opacity-30 italic text-branco">NENHUM CEDENTE ENCONTRADO NO SISTEMA.</td></tr>
                            ) : (
                                filteredCedentes.map((cedente) => (
                                    <tr key={cedente.id} className="border-b border-white/10 hover:bg-white/5 transition-colors group">
                                        <td className="py-4 pr-4 font-bold">{cedente.razao_social}</td>
                                        <td className="py-4 px-4 opacity-70">{cedente.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}</td>
                                        <td className="py-4 px-4 text-center text-gold font-black">
                                            {cedente.taxaPadraoDesagio.toFixed(2)}%
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex justify-center">
                                                {cedente.ativo ?
                                                    <span className="text-[10px] bg-gold/15 text-gold px-2 py-1 rounded-full font-black border border-gold/30">ATIVO</span> :
                                                    <span className="text-[10px] bg-red-500/15 text-red-300 px-2 py-1 rounded-full font-black border border-red-500/30">INATIVO</span>
                                                }
                                            </div>
                                        </td>
                                        <td className="py-4 pl-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(cedente)}
                                                    className="p-2 hover:bg-gold hover:text-wine transition-all rounded-lg border border-white/10 text-branco"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cedente.id)}
                                                    className="p-2 hover:bg-red-500 hover:text-branco transition-all rounded-lg border border-white/10 text-branco"
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
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

                    <div className="brutalist-card bg-wine border-white/10 max-w-xl w-full relative z-[110] animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col p-8 text-branco shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                        <h3 className="text-3xl font-black font-mono tracking-tighter uppercase mb-4 border-b border-white/10 pb-4 shrink-0 text-branco">
                            {editingId ? 'Editar Cedente' : 'Novo Cedente'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black opacity-65 tracking-widest block text-branco">Razão Social</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-wine/30 border border-white/20 p-3 rounded-xl font-mono outline-none focus:border-white text-branco"
                                    value={formData.razao_social}
                                    onChange={e => setFormData({ ...formData, razao_social: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black opacity-65 tracking-widest block text-branco">CNPJ (APENAS NÚMEROS)</label>
                                <input
                                    required
                                    maxLength="14"
                                    type="text"
                                    className="w-full bg-wine/30 border border-white/20 p-3 rounded-xl font-mono outline-none focus:border-white text-branco"
                                    value={formData.cnpj}
                                    onChange={e => setFormData({ ...formData, cnpj: e.target.value.replace(/\D/g, '') })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black opacity-65 tracking-widest block text-branco">Taxa Padrão de Deságio (% a.m.)</label>
                                    <input
                                        required
                                        step="0.01"
                                        type="number"
                                        className="w-full bg-wine/30 border border-white/20 p-3 rounded-xl font-mono outline-none focus:border-white text-branco"
                                        value={formData.taxaPadraoDesagio}
                                        onChange={e => setFormData({ ...formData, taxaPadraoDesagio: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black opacity-65 tracking-widest block text-branco">Faturamento Anual (Valor)</label>
                                    <input
                                        required
                                        step="0.01"
                                        type="number"
                                        className="w-full bg-wine/30 border border-white/20 p-3 rounded-xl font-mono outline-none focus:border-white text-branco"
                                        value={formData.faturamentoAnual}
                                        onChange={e => setFormData({ ...formData, faturamentoAnual: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black opacity-65 tracking-widest block text-branco">Endereço Completo</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-wine/30 border border-white/20 p-3 rounded-xl font-mono outline-none focus:border-white text-branco"
                                    value={formData.enderecoCompleto}
                                    onChange={e => setFormData({ ...formData, enderecoCompleto: e.target.value })}
                                />
                            </div>

                            <div className="border-t border-white/10 pt-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-gold mb-4">Informações de Contato</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] uppercase font-black opacity-65 tracking-widest block text-branco">Nome do Contato</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-wine/30 border border-white/20 p-3 rounded-xl font-mono outline-none focus:border-white text-branco"
                                            value={formData.contatoNome}
                                            onChange={e => setFormData({ ...formData, contatoNome: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black opacity-65 tracking-widest block text-branco">Tel Fixo</label>
                                        <input
                                            type="text"
                                            className="w-full bg-wine/30 border border-white/20 p-3 rounded-xl font-mono outline-none focus:border-white text-branco"
                                            value={formData.contatoTelefoneFixo}
                                            onChange={e => setFormData({ ...formData, contatoTelefoneFixo: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black opacity-65 tracking-widest block text-branco">Celular</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-wine/30 border border-white/20 p-3 rounded-xl font-mono outline-none focus:border-white text-branco"
                                            value={formData.contatoCelular}
                                            onChange={e => setFormData({ ...formData, contatoCelular: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] uppercase font-black opacity-65 tracking-widest block text-branco">Email</label>
                                        <input
                                            required
                                            type="email"
                                            className="w-full bg-wine/30 border border-white/20 p-3 rounded-xl font-mono outline-none focus:border-white text-branco"
                                            value={formData.contatoEmail}
                                            onChange={e => setFormData({ ...formData, contatoEmail: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 py-2">
                                <div
                                    onClick={() => setFormData({ ...formData, ativo: !formData.ativo })}
                                    className={`w-12 h-6 flex items-center p-1 cursor-pointer transition-colors rounded-full ${formData.ativo ? 'bg-gold' : 'bg-white/10 border border-white/10'}`}
                                >
                                    <div className={`w-4 h-4 bg-wine rounded-full transition-transform ${formData.ativo ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-[10px] uppercase font-black opacity-70 tracking-widest">
                                    Status: {formData.ativo ? 'ATIVO' : 'INATIVO'}
                                </span>
                            </div>

                            <div className="flex gap-4 pt-6 sticky bottom-0 bg-wine pb-2 mt-auto border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setIsModalOpen(false); }}
                                    className="flex-1 px-6 py-3 border border-white/20 text-xs font-mono uppercase hover:bg-white/5 transition-colors rounded-xl text-branco"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-white text-wine font-black hover:bg-white/95 rounded-xl transition-all font-mono py-3 uppercase text-center"
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
