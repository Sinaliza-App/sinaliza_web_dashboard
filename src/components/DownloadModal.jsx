import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Cpu,
  Layers,
  Copy,
  Check,
  Globe
} from 'lucide-react';

export default function DownloadModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'qrcode' | 'guide'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // URLs oficiais e diretas para o download do APK (GitHub Releases e servidor local)
  const githubReleaseApkUrl = 'https://github.com/Sinaliza-App/sinaliza_app_libras/releases/latest/download/app-arm64-v8a-release.apk';
  const githubReleasePageUrl = 'https://github.com/Sinaliza-App/sinaliza_app_libras/releases';
  const localApkUrl = '/downloads/sinaliza-app.apk';

  // O QR Code aponta para o link global oficial do GitHub Release (funciona em qualquer celular, 4G ou Wi-Fi)
  const qrTargetUrl = githubReleaseApkUrl;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&bgcolor=020617&color=10b981&margin=12&data=${encodeURIComponent(qrTargetUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrTargetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectDownload = (url) => {
    // Cria um elemento âncora temporário para forçar o download direto do binário
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Sinaliza-App-v1.2.0.apk';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop escuro com blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-lg bg-slate-900/95 border border-slate-700/70 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] text-slate-100 overflow-hidden"
        >
          {/* Efeitos de Luz de Fundo */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between relative mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/25 flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">Sinaliza Mobile</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    APK v1.2.0
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">App de LIBRAS com Inteligência Artificial On-Device</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Abas */}
          <div className="flex bg-slate-800/60 p-1 rounded-xl mb-5 border border-slate-700/50">
            <button
              type="button"
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all ${
                activeTab === 'direct'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Download do APK
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qrcode')}
              className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'qrcode'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode size={14} />
              QR Code Celular
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all ${
                activeTab === 'guide'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Como Instalar
            </button>
          </div>

          {/* Conteúdo das Abas */}
          {activeTab === 'direct' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Cpu size={14} className="text-emerald-400" />
                    Motor Neural
                  </span>
                  <span className="font-semibold text-white">ONNX Runtime Edge AI (~4ms)</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Layers size={14} className="text-emerald-400" />
                    Modelos Neurais
                  </span>
                  <span className="font-semibold text-white">Alfabeto (MLP) + Dinâmico (LSTM)</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    Compatibilidade
                  </span>
                  <span className="font-semibold text-white">Android 8.0+ (ARM64) • 93 MB</span>
                </div>
              </div>

              {/* Botão Principal: Download via GitHub Release Oficial */}
              <button
                type="button"
                onClick={() => handleDirectDownload(githubReleaseApkUrl)}
                className="w-full group flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl font-bold text-base shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all duration-300 transform active:scale-[0.98]"
              >
                <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                <span>Baixar APK Oficial (GitHub CDN)</span>
              </button>

              {/* Opção Alternativa: Servidor Web Local */}
              <div className="flex items-center justify-between pt-1 px-1">
                <button
                  type="button"
                  onClick={() => handleDirectDownload(localApkUrl)}
                  className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <Globe size={13} />
                  <span>Download direto do site (.apk local)</span>
                </button>

                <a
                  href={githubReleasePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 hover:underline"
                >
                  Ver no GitHub
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'qrcode' && (
            <div className="flex flex-col items-center text-center space-y-4 py-1">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-700/60 shadow-inner">
                <img
                  src={qrCodeImageUrl}
                  alt="QR Code para download do APK Sinaliza"
                  className="w-48 h-48 rounded-xl object-contain"
                />
              </div>

              <div className="space-y-2 w-full">
                <p className="text-sm font-semibold text-white">Aponte a câmera do seu smartphone</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  O download do instalador <strong>Sinaliza-App.apk</strong> iniciará diretamente no seu celular Android.
                </p>

                {/* Caixa de Copiar Link */}
                <div className="mt-3 flex items-center gap-2 p-2 bg-slate-950/80 border border-slate-800 rounded-xl text-left">
                  <input
                    type="text"
                    readOnly
                    value={qrTargetUrl}
                    className="flex-1 bg-transparent text-[11px] font-mono text-emerald-400 focus:outline-none truncate px-1"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check size={13} className="text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3 py-1">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-white">Baixe o arquivo .apk</p>
                  <p className="text-slate-400 mt-0.5">Clique em "Baixar APK Oficial" ou aponte a câmera do celular para o QR Code.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-white">Autorize a instalação</p>
                  <p className="text-slate-400 mt-0.5">Quando o Android perguntar sobre "fontes desconhecidas", toque em Permitir (o app é seguro e oficial).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-white">Pronto para praticar!</p>
                  <p className="text-slate-400 mt-0.5">Abra o app Sinaliza, autorize o uso da câmera e aprenda LIBRAS com IA em tempo real.</p>
                </div>
              </div>
            </div>
          )}

          {/* Rodapé */}
          <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Sinaliza v1.2.0 • PIEC-3</span>
            <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
              <CheckCircle2 size={13} />
              Pronto para uso
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
