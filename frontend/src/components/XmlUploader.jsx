import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, Trash2, X, Send } from 'lucide-react';

const XmlUploader = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [cnpjCedente, setCnpjCedente] = useState('');
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === "N/A" || isNaN(Date.parse(dateStr))) return "--/--/----";
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const isValidDate = (dateStr) => {
        if (!dateStr || dateStr === "N/A") return false;
        const d = new Date(dateStr);
        return d instanceof Date && !isNaN(d);
    };

    const formatCurrency = (val) => {
        return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const processFiles = async (uploadedFiles) => {
        const filePromises = Array.from(uploadedFiles).map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(content, "text/xml");

                    // Helpers to extract data safely
                    const getText = (selector) => xmlDoc.querySelector(selector)?.textContent || "N/A";

                    // Extract Access Key from infNFe ID attribute (e.g., NFe35...)
                    const infNFe = xmlDoc.querySelector('infNFe');
                    const chave = infNFe ? infNFe.getAttribute('Id')?.replace('NFe', '') : "N/A";

                    // Extract values
                    const emitente = getText('emit > CNPJ') || getText('emit > xNome');
                    const sacado = getText('dest > CNPJ') || getText('dest > xNome');
                    const valorTotal = getText('vNF');
                    const dataEmissao = getText('dhEmi')?.split('T')[0] || "N/A";

                    // Extract all Duplicatas
                    const dupElements = Array.from(xmlDoc.querySelectorAll('cobr > dup'));
                    const duplicatas = dupElements.map(dup => ({
                        numero: dup.querySelector('nDup')?.textContent || "N/A",
                        vencimento: dup.querySelector('dVenc')?.textContent || "N/A",
                        valor: dup.querySelector('vDup')?.textContent || "0.00"
                    }));

                    resolve({
                        id: Math.random().toString(36).substr(2, 9),
                        fileName: file.name,
                        chave,
                        emitente,
                        sacado,
                        valorTotal,
                        dataEmissao,
                        duplicatas,
                        status: chave.length === 44 ? "valid" : "invalid",
                        selected: true
                    });
                };
                reader.readAsText(file);
            });
        });

        const extractedFiles = await Promise.all(filePromises);
        setFiles(prev => [...prev, ...extractedFiles]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    };

    const handleFileSelect = (e) => {
        processFiles(e.target.files);
    };

    const toggleFileSelection = (id) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
    };

    const handleClearSelection = () => {
        setFiles(prev => prev.map(f => ({ ...f, selected: false })));
    };

    const handleCancel = () => {
        setFiles([]);
        setCnpjCedente('');
    };

    const handleGenerateBordero = async () => {
        const selectedFiles = files.filter(f => f.selected);

        if (!cnpjCedente) {
            alert("Por favor, informe o CNPJ do Cliente (Cedente).");
            return;
        }

        if (selectedFiles.length === 0) {
            alert("Por favor, selecione ao menos uma nota fiscal para processar.");
            return;
        }

        if (isGenerating) return;
        setIsGenerating(true);
        try {
            // 1. Fetch current settings
            let settings, tarifasCustomizadas;
            try {
                const [taxasRes, customRes] = await Promise.all([
                    axios.get('http://localhost:8080/api/settings/taxas'),
                    axios.get('http://localhost:8080/api/settings/tarifas-custom')
                ]);
                settings = taxasRes.data;
                tarifasCustomizadas = customRes.data;
            } catch (err) {
                console.error("Settings fetch failed", err);
                alert("Erro ao buscar configurações das taxas. Verifique se o servidor backend está rodando.");
                return;
            }

            // 2. Prepare items (all duplicatas from selected files)
            const items = selectedFiles.flatMap(file =>
                file.duplicatas
                    .filter(dup => {
                        const valid = isValidDate(dup.vencimento) && !isNaN(parseFloat(dup.valor));
                        if (!valid) console.warn(`Duplicata inválida ignorada: ${dup.numero}`, dup);
                        return valid;
                    })
                    .map(dup => ({
                        numero: dup.numero,
                        sacado: file.sacado,
                        valor: parseFloat(dup.valor),
                        vencimento: dup.vencimento,
                        dataEmissao: file.dataEmissao
                    }))
            );

            if (items.length === 0) {
                alert("Nenhuma duplicata válida encontrada para gerar o borderô. Verifique as datas e valores nos XMLs selecionados.");
                return;
            }

            // 3. Request PDF
            const response = await axios.post('http://localhost:8080/api/bordero/generate', {
                items,
                cnpjCedente,
                ...settings,
                tarifasCustomizadas
            }, { responseType: 'blob' });

            // 4. Download
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bordero_${cnpjCedente}_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            alert("Borderô gerado com sucesso!");
        } catch (error) {
            console.error("Erro ao gerar borderô", error);
            const msg = error.response ? `Erro do servidor: ${error.response.status}` : "Erro ao conectar com o servidor. Verifique se o backend está ativo.";
            alert(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const selectedCount = files.filter(f => f.selected).length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <header className="border-b-4 border-matrix-orange pb-4">
                <div className="flex items-center gap-3">
                    <FileText className="w-10 h-10 text-matrix-orange" />
                    <div>
                        <h1 className="text-3xl font-black font-mono tracking-tighter uppercase italic">
                            Upload de Notas Fiscais Eletrônicas
                        </h1>
                        <p className="text-matrix-orange font-mono text-xs uppercase tracking-widest">Sistema de Processamento em Lote de NFe-XML</p>
                    </div>
                </div>
            </header>

            {/* CNPJ INPUT */}
            <div className="bg-matrix-gray/40 p-6 border-l-8 border-matrix-orange">
                <label className="block text-xs font-mono uppercase opacity-70 mb-2">
                    CNPJ do Cliente (Cedente) *
                </label>
                <input
                    type="text"
                    value={cnpjCedente}
                    onChange={(e) => setCnpjCedente(e.target.value)}
                    placeholder="Exemplo: 12345678000195"
                    className="w-full bg-matrix-black border-2 border-white/10 p-3 font-mono text-xl focus:border-matrix-orange outline-none transition-colors"
                />
            </div>

            {/* DROPZONE */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`
                    border-4 border-dashed p-10 transition-all flex flex-col items-center justify-center space-y-4 cursor-pointer
                    ${isDragging ? 'border-matrix-orange bg-matrix-orange/10 scale-[0.99]' : 'border-white/20 bg-matrix-gray/30'}
                `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xml"
                    multiple
                    onChange={handleFileSelect}
                />
                <Upload className={`w-12 h-12 ${isDragging ? 'text-matrix-orange' : 'text-white/20'}`} />
                <div className="text-center">
                    <p className="text-lg font-bold uppercase tracking-tight">Clique aqui ou arraste os arquivos XML</p>
                    <p className="text-[10px] font-mono opacity-50 uppercase mt-1">Suporte para múltiplos arquivos simultaneamente</p>
                </div>
            </div>

            {/* SELECTION INFO */}
            {files.length > 0 && (
                <div className="flex items-center gap-2 text-matrix-orange font-mono text-sm uppercase font-bold px-1">
                    <FileText className="w-4 h-4" />
                    <span>Arquivos Selecionados ( {selectedCount} )</span>
                </div>
            )}

            {/* PREVIEW GRID */}
            {files.length > 0 && (
                <div className="space-y-4">
                    <div className="grid gap-3">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                onClick={() => toggleFileSelection(file.id)}
                                className={`
                                    border-2 transition-all cursor-pointer overflow-hidden
                                    ${file.selected ? 'border-matrix-orange bg-matrix-orange/5' : 'border-white/5 bg-matrix-black grayscale opacity-70'}
                                `}
                            >
                                {/* INVOICE HEADER ROW */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center">
                                    <div className="md:col-span-1 flex justify-center">
                                        <div className={`
                                            w-6 h-6 border-2 flex items-center justify-center transition-colors
                                            ${file.selected ? 'border-matrix-orange bg-matrix-orange text-black' : 'border-white/20'}
                                        `}>
                                            {file.selected && <CheckCircle className="w-4 h-4" />}
                                        </div>
                                    </div>
                                    <div className="md:col-span-5">
                                        <p className="text-[10px] opacity-60 uppercase font-mono mb-1">Arquivo XML: {file.fileName}</p>
                                        <p className="text-[10px] opacity-40 uppercase font-mono">Chave: {file.chave}</p>
                                    </div>
                                    <div className="md:col-span-3">
                                        <p className="text-[10px] opacity-50 uppercase font-mono">Sacado</p>
                                        <p className="text-xs font-bold truncate tracking-tighter italic">{file.sacado}</p>
                                    </div>
                                    <div className="md:col-span-1">
                                        <p className="text-[10px] opacity-50 uppercase font-mono">Emissão</p>
                                        <p className="text-[10px] font-mono">{formatDate(file.dataEmissao)}</p>
                                    </div>
                                    <div className="md:col-span-2 text-right">
                                        <p className="text-[10px] opacity-50 uppercase font-mono">Total NFe R$</p>
                                        <p className="text-lg font-black text-matrix-orange">{formatCurrency(file.valorTotal)}</p>
                                    </div>
                                </div>

                                {/* DUPLICATAS SUB-TABLE */}
                                {file.selected && file.duplicatas.length > 0 && (
                                    <div className="bg-white/5 p-4 border-t border-white/5">
                                        <p className="text-[10px] font-black uppercase mb-2 tracking-widest text-matrix-orange">
                                            Detalhamento de Duplicatas ({file.duplicatas.length})
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {file.duplicatas.map((dup, dIdx) => (
                                                <div key={dIdx} className="bg-matrix-gray/40 border border-white/10 p-2 flex justify-between items-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] opacity-50 uppercase">Nº {dup.numero}</span>
                                                        <span className="text-xs font-mono">{formatDate(dup.vencimento)}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-black">R$ {formatCurrency(dup.valor)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 flex flex-wrap gap-4 justify-between items-center bg-matrix-gray/20 p-6 border-t-2 border-white/5">
                        <div className="flex gap-4">
                            <button
                                onClick={handleCancel}
                                className="px-6 py-3 border-2 border-white/20 text-xs font-mono uppercase hover:bg-white/5 transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" /> Cancelar
                            </button>
                            <button
                                onClick={handleClearSelection}
                                className="px-6 py-3 border-2 border-white/20 text-xs font-mono uppercase hover:bg-white/5 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Limpar toda a seleção
                            </button>
                        </div>

                        <button
                            onClick={handleGenerateBordero}
                            disabled={isGenerating || files.length === 0}
                            className={`
                                brutalist-button px-10 py-4 flex items-center gap-4 text-lg
                                ${isGenerating || files.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
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

export default XmlUploader;
