import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const XmlUploader = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === "N/A") return dateStr;
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
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
                        name: file.name,
                        chave,
                        emitente,
                        sacado,
                        valorTotal,
                        dataEmissao,
                        duplicatas,
                        status: chave.length === 44 ? "valid" : "invalid"
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

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <header className="border-b-4 border-matrix-orange pb-4">
                <h1 className="text-4xl font-black font-mono tracking-tighter uppercase italic">
                    Upload de Notas (XML)
                </h1>
                <p className="text-matrix-orange font-mono text-sm uppercase">Parser NF-e 4.00</p>
            </header>

            {/* DROPZONE */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`
                    border-4 border-dashed p-12 transition-all flex flex-col items-center justify-center space-y-4 cursor-pointer
                    ${isDragging ? 'border-matrix-orange bg-matrix-orange/10 scale-[0.98]' : 'border-white/20 bg-matrix-gray/30'}
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
                <Upload className={`w-16 h-16 ${isDragging ? 'text-matrix-orange' : 'text-white/20'}`} />
                <div className="text-center">
                    <p className="text-xl font-bold uppercase">Arraste seus arquivos .xml aqui</p>
                    <p className="text-xs font-mono opacity-50 uppercase mt-2">ou clique para selecionar do PC</p>
                </div>
            </div>

            {/* PREVIEW GRID */}
            {files.length > 0 && (
                <div className="space-y-4">
                    {files.map((file, idx) => (
                        <div key={idx} className="border-2 border-white/10 bg-matrix-black overflow-hidden">
                            {/* INVOICE HEADER ROW */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-l-4 border-matrix-orange items-center">
                                <div className="md:col-span-1 flex justify-center">
                                    <CheckCircle className="text-matrix-green w-6 h-6" />
                                </div>
                                <div className="md:col-span-4">
                                    <p className="text-[10px] opacity-50 uppercase font-mono">Chave de Acesso</p>
                                    <p className="text-xs font-mono break-all">{file.chave}</p>
                                </div>
                                <div className="md:col-span-3">
                                    <p className="text-[10px] opacity-50 uppercase font-mono">Emitente / Sacado</p>
                                    <p className="text-sm font-bold truncate">{file.emitente}</p>
                                    <p className="text-[10px] opacity-50 truncate">{file.sacado}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-[10px] opacity-50 uppercase font-mono">Emissão</p>
                                    <p className="text-xs font-mono">{formatDate(file.dataEmissao)}</p>
                                </div>
                                <div className="md:col-span-2 text-right">
                                    <p className="text-[10px] opacity-50 uppercase font-mono">Total</p>
                                    <p className="text-lg font-black text-matrix-orange whitespace-nowrap">R$ {formatCurrency(file.valorTotal)}</p>
                                </div>
                            </div>

                            {/* DUPLICATAS SUB-TABLE */}
                            {file.duplicatas.length > 0 && (
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

                    <div className="mt-8 flex justify-end">
                        <button className="brutalist-button px-12 py-4 flex items-center gap-4 text-xl">
                            ENVIAR PARA ANÁLISE
                            <FileText className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default XmlUploader;
