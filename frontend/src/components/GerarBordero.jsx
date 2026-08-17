import React, { useState, useRef } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import {
    Upload, FileText, FileSpreadsheet, Keyboard, Trash2, X, Send, Download, AlertTriangle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8369/api';

// ---- Item id helper --------------------------------------------------------
let idCounter = 0;
const makeId = () => `item-${Date.now()}-${idCounter++}`;

// ---- Column mapping (CSV / Excel) ------------------------------------------
// Normaliza um cabeçalho de coluna: remove acentos, espaços e pontuação, deixa
// minúsculo, para casar com as variações comuns que um usuário pode digitar.
const ACCENT_MAP = {
    á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a',
    é: 'e', è: 'e', ê: 'e', ë: 'e',
    í: 'i', ì: 'i', î: 'i', ï: 'i',
    ó: 'o', ò: 'o', ô: 'o', õ: 'o', ö: 'o',
    ú: 'u', ù: 'u', û: 'u', ü: 'u',
    ç: 'c', ñ: 'n',
};
const stripAccents = (s) => s.split('').map((ch) => ACCENT_MAP[ch] ?? ch).join('');
const normalizeHeader = (h) => stripAccents(String(h ?? '').toLowerCase())
    .replace(/[^a-z0-9]/g, '');

const HEADER_ALIASES = {
    numero: ['numero', 'numerotitulo', 'numeronota', 'ndup', 'nnota', 'titulo'],
    sacado: ['sacado', 'cliente', 'sacadocnpj', 'razaosocial', 'nomesacado', 'pagador'],
    valor: ['valor', 'valorbruto', 'valornota', 'valortitulo', 'vdup', 'vnf'],
    vencimento: ['vencimento', 'datavencimento', 'dvenc'],
    dataemissao: ['dataemissao', 'emissao', 'dhemi'],
};

// Aceita Date (célula de Excel já formatada como data), string ISO (yyyy-mm-dd),
// string BR (dd/mm/yyyy) e, como último recurso, número serial de data do Excel.
const parseFlexibleDate = (value) => {
    if (value == null || value === '') return null;
    if (value instanceof Date && !isNaN(value)) {
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, '0');
        const d = String(value.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    if (typeof value === 'number') {
        // Serial de data do Excel (epoch 1899-12-30)
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const d = new Date(excelEpoch.getTime() + value * 86400000);
        return isNaN(d) ? null : d.toISOString().split('T')[0];
    }
    const str = String(value).trim();
    const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const br = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
    return null;
};

const parseFlexibleValor = (value) => {
    if (value == null || value === '') return null;
    if (typeof value === 'number') return value;
    let str = String(value).trim().replace(/^R\$\s*/, '');
    if (/^\d{1,3}(\.\d{3})*,\d+$/.test(str)) {
        str = str.replace(/\./g, '').replace(',', '.'); // 1.234,56 -> 1234.56
    } else {
        str = str.replace(',', '.');
    }
    const n = parseFloat(str);
    return isNaN(n) ? null : n;
};

// Converte uma linha de CSV/Excel (chaves = cabeçalhos originais) num item da
// lista unificada, tolerando variações de coluna e sinalizando erro sem
// interromper a importação das demais linhas.
const mapRowToItem = (rawRow, origem, index) => {
    const normalizedRow = {};
    Object.entries(rawRow).forEach(([k, v]) => { normalizedRow[normalizeHeader(k)] = v; });
    const pick = (canon) => {
        for (const alias of HEADER_ALIASES[canon]) {
            const v = normalizedRow[alias];
            if (v !== undefined && v !== null && v !== '') return v;
        }
        return undefined;
    };

    const numero = pick('numero');
    const sacado = pick('sacado');
    const valor = parseFlexibleValor(pick('valor'));
    const vencimento = parseFlexibleDate(pick('vencimento'));
    const dataEmissao = parseFlexibleDate(pick('dataemissao'));

    let erro = null;
    if (!sacado) erro = 'Coluna "sacado" ausente ou vazia';
    else if (valor === null || valor <= 0) erro = 'Valor ausente ou inválido';
    else if (!vencimento) erro = 'Vencimento ausente ou em formato não reconhecido';

    return {
        id: makeId(),
        origem,
        numero: numero ? String(numero) : `ITEM-${index + 1}`,
        sacado: sacado ? String(sacado) : '',
        valor,
        vencimento,
        dataEmissao,
        chaveNfe: undefined,
        erro,
    };
};

const METHODS = [
    { id: 'xml', label: 'XML de NF-e', icon: FileText },
    { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
    { id: 'excel', label: 'Excel', icon: FileSpreadsheet },
    { id: 'manual', label: 'Entrada Manual', icon: Keyboard },
];

const GerarBordero = () => {
    const { showToast } = useToast();
    const [method, setMethod] = useState('xml');
    const [items, setItems] = useState([]);
    const [cnpjCedente, setCnpjCedente] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const [manualForm, setManualForm] = useState({ numero: '', sacado: '', valor: '', dataEmissao: today, vencimento: '' });

    const xmlInputRef = useRef(null);
    const csvInputRef = useRef(null);
    const excelInputRef = useRef(null);

    // ---- Formatação -------------------------------------------------------
    const formatDate = (dateStr) => {
        if (!dateStr) return '--/--/----';
        const parts = String(dateStr).split('-');
        if (parts.length !== 3) return '--/--/----';
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    };

    const formatCurrency = (val) => {
        if (val == null || isNaN(val)) return '--';
        return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // ---- XML ----------------------------------------------------------------
    const isValidDateStr = (dateStr) => {
        if (!dateStr || dateStr === 'N/A') return false;
        const d = new Date(dateStr);
        return d instanceof Date && !isNaN(d);
    };

    const processXmlFiles = async (uploadedFiles) => {
        const filePromises = Array.from(uploadedFiles).map((file) => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(content, 'text/xml');

                const getText = (selector) => {
                    const val = xmlDoc.querySelector(selector)?.textContent;
                    return val && val.trim() ? val.trim() : null;
                };

                const sacado = getText('dest > CNPJ') || getText('dest > xNome') || 'SACADO_DESCONHECIDO';
                const dataEmissaoRaw = getText('dhEmi');
                const dataEmissao = dataEmissaoRaw ? dataEmissaoRaw.split('T')[0] : null;
                const chaveRaw = xmlDoc.querySelector('infNFe')?.getAttribute('Id')?.replace('NFe', '');
                const chave = chaveRaw && chaveRaw.length === 44 ? chaveRaw : undefined;

                const dupElements = Array.from(xmlDoc.querySelectorAll('cobr > dup'));
                const newItems = dupElements.map((dup) => {
                    const numero = dup.querySelector('nDup')?.textContent || 'N/A';
                    const vencimento = dup.querySelector('dVenc')?.textContent || 'N/A';
                    const valorRaw = dup.querySelector('vDup')?.textContent || '0';
                    const valor = parseFloat(valorRaw);
                    const vencOk = isValidDateStr(vencimento);
                    return {
                        id: makeId(),
                        origem: `XML: ${file.name}`,
                        numero,
                        sacado,
                        valor: isNaN(valor) ? null : valor,
                        vencimento: vencOk ? vencimento : null,
                        dataEmissao,
                        chaveNfe: chave,
                        erro: (!vencOk || isNaN(valor)) ? 'Data ou valor inválido no XML' : null,
                    };
                });
                resolve(newItems);
            };
            reader.readAsText(file);
        }));

        const results = await Promise.all(filePromises);
        const flat = results.flat();
        if (flat.length === 0) {
            showToast('Nenhuma duplicata encontrada nos XML selecionados.', 'warning');
            return;
        }
        setItems((prev) => [...prev, ...flat]);
    };

    const handleXmlDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processXmlFiles(e.dataTransfer.files);
    };
    const handleXmlSelect = (e) => {
        processXmlFiles(e.target.files);
        e.target.value = null;
    };

    // ---- CSV ------------------------------------------------------------------
    const handleCsvSelect = (e) => {
        const file = e.target.files?.[0];
        e.target.value = null;
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data.length === 0) {
                    showToast('Nenhuma linha encontrada no CSV.', 'warning');
                    return;
                }
                const newItems = results.data.map((row, idx) => mapRowToItem(row, `CSV: ${file.name}`, idx));
                setItems((prev) => [...prev, ...newItems]);
            },
            error: (err) => showToast('Erro ao ler CSV: ' + err.message, 'error'),
        });
    };

    const downloadCsvTemplate = () => {
        const content = 'numero,sacado,valor,dataEmissao,vencimento\n'
            + 'NF-001,12345678000195,1500.00,2026-08-01,2026-09-01\n';
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'modelo_importacao.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    // ---- Excel ------------------------------------------------------------------
    const handleExcelSelect = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = null;
        if (!file) return;
        try {
            const buffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                showToast('Nenhuma planilha encontrada no arquivo.', 'warning');
                return;
            }

            const headers = [];
            worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
                headers[colNumber] = String(cell.value ?? '').trim();
            });

            const rows = [];
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                const obj = {};
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const key = headers[colNumber];
                    if (!key) return;
                    let val = cell.value;
                    if (val && typeof val === 'object' && 'text' in val) val = val.text; // rich text
                    if (val && typeof val === 'object' && 'result' in val) val = val.result; // fórmula
                    obj[key] = val;
                });
                if (Object.values(obj).some((v) => v !== null && v !== undefined && v !== '')) {
                    rows.push(obj);
                }
            });

            if (rows.length === 0) {
                showToast('Nenhuma linha de dados encontrada na primeira planilha do arquivo.', 'warning');
                return;
            }
            const newItems = rows.map((row, idx) => mapRowToItem(row, `Excel: ${file.name}`, idx));
            setItems((prev) => [...prev, ...newItems]);
        } catch (err) {
            console.error(err);
            showToast('Erro ao ler o arquivo Excel: ' + err.message, 'error');
        }
    };

    // ---- Manual ------------------------------------------------------------------
    const addManualItem = () => {
        const valor = parseFlexibleValor(manualForm.valor);
        if (!manualForm.sacado || valor === null || valor <= 0 || !manualForm.vencimento) {
            showToast('Preencha ao menos Sacado, Valor e Vencimento corretamente.', 'warning');
            return;
        }
        setItems((prev) => [...prev, {
            id: makeId(),
            origem: 'Manual',
            numero: manualForm.numero || `MANUAL-${prev.length + 1}`,
            sacado: manualForm.sacado,
            valor,
            vencimento: manualForm.vencimento,
            dataEmissao: manualForm.dataEmissao || null,
            chaveNfe: undefined,
            erro: null,
        }]);
        setManualForm({ numero: '', sacado: '', valor: '', dataEmissao: today, vencimento: '' });
    };

    // ---- Lista de itens (comum a todos os métodos) -------------------------
    const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
    const clearAll = () => { setItems([]); setCnpjCedente(''); };

    const validItems = items.filter((i) => !i.erro);
    const totalValor = validItems.reduce((sum, i) => sum + (i.valor || 0), 0);

    // ---- Gerar Borderô -------------------------------------------------------
    const handleGenerateBordero = async () => {
        if (!cnpjCedente) {
            showToast('Por favor, informe o CNPJ do Cliente (Cedente).', 'warning');
            return;
        }
        if (validItems.length === 0) {
            showToast('Adicione ao menos um item válido para gerar o borderô.', 'warning');
            return;
        }
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            let settings, tarifasCustomizadas;
            try {
                const [taxasRes, customRes] = await Promise.all([
                    axios.get(`${API_URL}/settings/taxas`),
                    axios.get(`${API_URL}/settings/tarifas-custom`),
                ]);
                settings = taxasRes.data;
                tarifasCustomizadas = customRes.data;
            } catch (err) {
                console.error('Settings fetch failed', err);
                showToast('Erro ao buscar configurações das taxas. Verifique se o servidor backend está rodando.', 'error');
                return;
            }

            const payloadItems = validItems.map((i) => ({
                numero: i.numero,
                sacado: i.sacado,
                valor: i.valor,
                vencimento: i.vencimento,
                dataEmissao: i.dataEmissao,
                chaveNfe: i.chaveNfe,
            }));

            const response = await axios.post(`${API_URL}/bordero/generate`, {
                items: payloadItems,
                cnpjCedente,
                ...settings,
                tarifasCustomizadas,
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bordero_${cnpjCedente}_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            showToast('Borderô gerado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar borderô', error);
            const msg = error.response ? `Erro do servidor: ${error.response.status}` : 'Erro ao conectar com o servidor. Verifique se o backend está ativo.';
            showToast(msg, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <header className="border-b border-wine/10 pb-4">
                <div className="flex items-center gap-3">
                    <FileText className="w-10 h-10 text-wine" />
                    <div>
                        <h1 className="text-3xl font-black font-mono tracking-tighter uppercase italic text-wine">
                            Gerar Borderô
                        </h1>
                        <p className="text-wine/60 font-mono text-xs uppercase tracking-widest">
                            XML de NF-e / CSV / Excel / Entrada Manual — mesma lista, mesmo borderô
                        </p>
                    </div>
                </div>
            </header>

            {/* CNPJ INPUT */}
            <div className="bg-wine p-6 rounded-2xl border border-wine/15 text-branco shadow-[0_8px_30px_rgba(74,16,13,0.15)]">
                <label className="block text-xs font-mono uppercase opacity-75 mb-2 text-branco">
                    CNPJ do Cliente (Cedente) *
                </label>
                <input
                    type="text"
                    value={cnpjCedente}
                    onChange={(e) => setCnpjCedente(e.target.value)}
                    placeholder="Exemplo: 12345678000195"
                    className="w-full bg-wine/30 border border-white/20 p-3 rounded-xl font-mono text-xl focus:border-white outline-none transition-colors text-gold font-bold"
                />
            </div>

            {/* METHOD SELECTOR */}
            <div className="flex flex-wrap gap-2">
                {METHODS.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={`flex items-center gap-2 px-5 py-3 text-xs uppercase font-bold tracking-widest transition-all border rounded-xl ${method === m.id
                            ? 'bg-wine text-branco border-wine shadow-[0_4px_12px_rgba(74,16,13,0.15)]'
                            : 'border-wine/20 text-wine hover:bg-wine/5'
                            }`}
                    >
                        <m.icon className="w-4 h-4" />
                        {m.label}
                    </button>
                ))}
            </div>

            {/* METHOD PANEL */}
            {method === 'xml' && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleXmlDrop}
                    onClick={() => xmlInputRef.current.click()}
                    className={`border border-dashed p-10 rounded-2xl transition-all flex flex-col items-center justify-center space-y-4 cursor-pointer ${isDragging ? 'border-wine bg-wine/10 scale-[0.99]' : 'border-wine/20 bg-wine/5'
                        }`}
                >
                    <input type="file" ref={xmlInputRef} className="hidden" accept=".xml" multiple onChange={handleXmlSelect} />
                    <Upload className={`w-12 h-12 ${isDragging ? 'text-wine' : 'text-wine/40'}`} />
                    <div className="text-center text-wine">
                        <p className="text-lg font-bold uppercase tracking-tight">Clique aqui ou arraste os arquivos XML</p>
                        <p className="text-[10px] font-mono opacity-60 uppercase mt-1">Suporte para múltiplos arquivos simultaneamente</p>
                    </div>
                </div>
            )}

            {method === 'csv' && (
                <div className="border border-dashed border-wine/20 bg-wine/5 p-10 rounded-2xl flex flex-col items-center justify-center space-y-4">
                    <input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={handleCsvSelect} />
                    <FileSpreadsheet className="w-12 h-12 text-wine/40" />
                    <div className="flex gap-4">
                        <button onClick={() => csvInputRef.current.click()} className="brutalist-button px-6 py-3">
                            Selecionar arquivo CSV
                        </button>
                        <button onClick={downloadCsvTemplate} className="px-6 py-3 border border-wine/25 text-xs font-mono uppercase hover:bg-wine/10 text-wine rounded-xl transition-colors flex items-center gap-2">
                            <Download className="w-4 h-4" /> Baixar modelo
                        </button>
                    </div>
                    <p className="text-[10px] font-mono opacity-60 uppercase text-center text-wine">
                        Colunas esperadas: numero, sacado, valor, dataEmissao, vencimento
                    </p>
                </div>
            )}

            {method === 'excel' && (
                <div className="border border-dashed border-wine/20 bg-wine/5 p-10 rounded-2xl flex flex-col items-center justify-center space-y-4">
                    <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleExcelSelect} />
                    <FileSpreadsheet className="w-12 h-12 text-wine/40" />
                    <button onClick={() => excelInputRef.current.click()} className="brutalist-button px-6 py-3">
                        Selecionar arquivo Excel
                    </button>
                    <p className="text-[10px] font-mono opacity-60 uppercase text-center text-wine">
                        Usa a primeira planilha do arquivo. Colunas esperadas: numero, sacado, valor, dataEmissao, vencimento
                    </p>
                </div>
            )}

            {method === 'manual' && (
                <div className="border border-wine/10 bg-wine p-6 rounded-2xl text-branco shadow-[0_8px_30px_rgba(74,16,13,0.15)] space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold opacity-60 mb-1">Número</label>
                            <input type="text" className="brutalist-input" value={manualForm.numero}
                                onChange={(e) => setManualForm({ ...manualForm, numero: e.target.value })} />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold opacity-60 mb-1">Sacado (CNPJ ou nome) *</label>
                            <input type="text" className="brutalist-input" value={manualForm.sacado}
                                onChange={(e) => setManualForm({ ...manualForm, sacado: e.target.value })} />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold opacity-60 mb-1">Valor (R$) *</label>
                            <input type="number" step="0.01" className="brutalist-input" value={manualForm.valor}
                                onChange={(e) => setManualForm({ ...manualForm, valor: e.target.value })} />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold opacity-60 mb-1">Emissão</label>
                            <input type="date" className="brutalist-input" value={manualForm.dataEmissao}
                                onChange={(e) => setManualForm({ ...manualForm, dataEmissao: e.target.value })} />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold opacity-60 mb-1">Vencimento *</label>
                            <input type="date" className="brutalist-input" value={manualForm.vencimento}
                                onChange={(e) => setManualForm({ ...manualForm, vencimento: e.target.value })} />
                        </div>
                    </div>
                    <button onClick={addManualItem} className="brutalist-button px-6 py-3">
                        Adicionar Item
                    </button>
                </div>
            )}

            {/* ITEMS TABLE (comum a todos os métodos) */}
            {items.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-wine font-mono text-sm uppercase font-bold px-1">
                        <FileText className="w-4 h-4 text-wine" />
                        <span>Itens ({items.length}) — {validItems.length} válidos, {items.length - validItems.length} com erro</span>
                    </div>

                    <div className="brutalist-card bg-wine overflow-hidden shadow-[0_8px_30px_rgba(74,16,13,0.15)] p-0">
                        <div className="overflow-x-auto p-6">
                            <table className="w-full text-left border-collapse text-xs font-mono">
                                <thead>
                                    <tr className="border-b border-white/10 uppercase font-black opacity-60 tracking-widest text-branco">
                                        <th className="pb-3 pr-3">Origem</th>
                                        <th className="pb-3 px-3">Título</th>
                                        <th className="pb-3 px-3">Sacado</th>
                                        <th className="pb-3 px-3">Emissão</th>
                                        <th className="pb-3 px-3">Vencimento</th>
                                        <th className="pb-3 px-3 text-right">Valor</th>
                                        <th className="pb-3 px-3">Status</th>
                                        <th className="pb-3 pl-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="text-branco/90">
                                    {items.map((item) => (
                                        <tr key={item.id} className={`border-b border-white/10 last:border-none ${item.erro ? 'bg-red-500/10' : ''}`}>
                                            <td className="py-3 pr-3 opacity-60 truncate max-w-[120px]">{item.origem}</td>
                                            <td className="py-3 px-3">{item.numero}</td>
                                            <td className="py-3 px-3 truncate max-w-[200px]">{item.sacado}</td>
                                            <td className="py-3 px-3">{formatDate(item.dataEmissao)}</td>
                                            <td className="py-3 px-3">{formatDate(item.vencimento)}</td>
                                            <td className="py-3 px-3 text-right font-black text-gold">{item.valor != null ? `R$ ${formatCurrency(item.valor)}` : '--'}</td>
                                            <td className="py-3 px-3">
                                                {item.erro ? (
                                                    <span className="flex items-center gap-1 text-red-300 font-bold"><AlertTriangle className="w-3 h-3" /> {item.erro}</span>
                                                ) : (
                                                    <span className="text-gold font-bold">OK</span>
                                                )}
                                            </td>
                                            <td className="py-3 pl-3 text-right">
                                                <button onClick={() => removeItem(item.id)} className="text-branco/30 hover:text-red-400 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-wrap gap-4 justify-between items-center bg-wine p-6 rounded-2xl border border-wine/10 text-branco shadow-[0_8px_30px_rgba(74,16,13,0.15)]">
                        <div className="flex items-center gap-6">
                            <button onClick={clearAll} className="px-6 py-3 border border-white/20 text-xs font-mono uppercase hover:bg-white/5 transition-colors rounded-xl flex items-center gap-2 text-branco">
                                <X className="w-4 h-4" /> Limpar tudo
                            </button>
                            <div className="text-xs font-mono uppercase opacity-80 text-branco">
                                Total válido: <span className="text-gold font-black">R$ {formatCurrency(totalValor)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateBordero}
                            disabled={isGenerating || validItems.length === 0}
                            className={`brutalist-button px-10 py-4 flex items-center gap-4 text-lg ${isGenerating || validItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Send className="w-5 h-5" />
                            {isGenerating ? 'PROCESSANDO...' : 'Processar e Gerar o Borderô'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GerarBordero;
