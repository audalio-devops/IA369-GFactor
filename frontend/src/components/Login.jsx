import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [hasError, setHasError] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = (e) => {
        e.preventDefault();
        setHasError(false);

        if (!username.trim() || !password.trim()) {
            setHasError(true);
            return;
        }

        const envUser = import.meta.env.VITE_LOGIN_USR;
        const envPwd = import.meta.env.VITE_LOGIN_PWD;

        if (username === envUser && password === envPwd) {
            setIsVerifying(true);
            setTimeout(() => {
                localStorage.setItem('ia369_authenticated', 'true');
                showToast('Acesso autorizado!', 'success');
                onLoginSuccess();
            }, 1200);
        } else {
            setHasError(true);
        }
    };

    return (
        <div
            className="fixed inset-0 min-h-screen flex items-center justify-center select-none"
            style={{
                background: 'linear-gradient(135deg, #5C1229 0%, #7a1a35 40%, #B8650A 100%)',
            }}
        >
            <AnimatePresence mode="wait">
                {!isVerifying ? (
                    <motion.div
                        key="login-card"
                        initial={{ opacity: 0, y: 32, scale: 0.97 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            x: hasError ? [-8, 8, -6, 6, -3, 3, 0] : 0,
                        }}
                        exit={{ opacity: 0, scale: 0.96, y: -20 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full max-w-sm bg-white px-10 py-10 shadow-2xl"
                        style={{ borderRadius: '24px' }}
                    >
                        {/* BRANDING */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                                <span style={{ color: '#5C1229' }}>IA</span>
                                <span style={{ color: '#C8991A' }}>369</span>
                                <span style={{ color: '#5C1229' }}> GFactor</span>
                            </h1>
                            <p
                                className="text-xs tracking-widest uppercase mt-1"
                                style={{ color: '#888', letterSpacing: '0.2em' }}
                            >
                                Sistema de Gestão
                            </p>
                            {/* Gold divider */}
                            <div
                                className="mx-auto mt-4"
                                style={{
                                    width: '80px',
                                    height: '2px',
                                    background: 'linear-gradient(90deg, transparent, #C8991A, transparent)',
                                    borderRadius: '2px',
                                }}
                            />
                        </div>

                        {/* FORM */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* USERNAME */}
                            <div>
                                <label
                                    className="block text-xs font-bold tracking-widest uppercase mb-2"
                                    style={{ color: '#C8991A', letterSpacing: '0.18em' }}
                                >
                                    Usuário
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        if (hasError) setHasError(false);
                                    }}
                                    autoComplete="username"
                                    placeholder="Digite seu usuário"
                                    className="w-full px-4 py-3 text-sm focus:outline-none transition-all"
                                    style={{
                                        background: '#F5EFE6',
                                        border: hasError ? '1.5px solid #C0392B' : '1.5px solid transparent',
                                        borderRadius: '10px',
                                        color: '#333',
                                        fontFamily: 'Inter, sans-serif',
                                    }}
                                />
                            </div>

                            {/* PASSWORD */}
                            <div>
                                <label
                                    className="block text-xs font-bold tracking-widest uppercase mb-2"
                                    style={{ color: '#C8991A', letterSpacing: '0.18em' }}
                                >
                                    Senha
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (hasError) setHasError(false);
                                        }}
                                        autoComplete="current-password"
                                        placeholder="Digite sua senha"
                                        className="w-full px-4 py-3 pr-10 text-sm focus:outline-none transition-all"
                                        style={{
                                            background: '#F5EFE6',
                                            border: hasError ? '1.5px solid #C0392B' : '1.5px solid transparent',
                                            borderRadius: '10px',
                                            color: '#333',
                                            fontFamily: 'Inter, sans-serif',
                                        }}
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors"
                                        style={{ color: '#aaa' }}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* ERROR FEEDBACK */}
                            {hasError && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-center font-medium"
                                    style={{ color: '#C0392B' }}
                                >
                                    Usuário ou senha inválido. Tente novamente.
                                </motion.p>
                            )}

                            {/* SUBMIT */}
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-3 text-sm font-bold text-white tracking-widest transition-all mt-2"
                                style={{
                                    background: '#5C1229',
                                    borderRadius: '10px',
                                    fontFamily: 'Inter, sans-serif',
                                    letterSpacing: '0.05em',
                                    boxShadow: '0 4px 14px rgba(92, 18, 41, 0.35)',
                                }}
                            >
                                Entrar
                            </motion.button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="connecting"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full max-w-sm bg-white px-10 py-10 text-center flex flex-col items-center"
                        style={{ borderRadius: '24px' }}
                    >
                        <div className="w-12 h-12 mb-6 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#5C1229', borderTopColor: 'transparent' }} />
                        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#5C1229' }}>
                            Verificando acesso...
                        </h2>
                        <p className="text-xs mt-2" style={{ color: '#aaa' }}>Aguarde um momento</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
