import React, { useState } from 'react';
import { DockConfig, DockItem } from '../types/dock';
import { 
  generatePowerShellScript, 
  generateReactCode, 
  generateSelfContainedHtml,
  generateUltraFidelityWindowsBat 
} from '../utils/codeGenerators';
import { soundFX } from '../utils/sound';
import { 
  X, Copy, Check, Terminal, Code2, FileJson, Download, 
  PlaySquare, PackageCheck, Zap, Sparkles, Monitor, AppWindow, Globe,
  ShieldAlert, Bot, ArrowDownToLine, MousePointer
} from 'lucide-react';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DockConfig;
  items: DockItem[];
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  config,
  items,
}) => {
  const [activeTab, setActiveTab] = useState<'agent' | 'ultra' | 'html' | 'powershell' | 'react' | 'json'>('agent');
  const [copied, setCopied] = useState(false);
  const [packDownloaded, setPackDownloaded] = useState(false);

  if (!isOpen) return null;

  const agentBatCode = `@echo off
title AuraDock - Agente de Bandeja do Windows
cd /d "%~dp0"

echo ===================================================================
echo             AuraDock - Agente Nativo da Bandeja do Sistema
echo ===================================================================
echo.
echo  * Fica rodando silenciosamente na bandeja (perto do relogio)
echo  * Menu lateral transparente, com vidro jateado e curvas Bezier
echo  * Abra as configuracoes a qualquer momento pela bandeja ou dock
echo  * Ao salvar/fechar as configuracoes, volta direto para a bandeja
echo  * Atalho global no Windows: Ctrl + Espaco
echo.

if not exist "node_modules\\electron" (
    echo [INFO] Preparando ambiente Electron no Windows...
    call npm install
)

echo [OK] Iniciando agente AuraDock...
call npx electron electron/main.cjs
exit
`;

  const ultraBatCode = generateUltraFidelityWindowsBat(config, items);
  const htmlCode = generateSelfContainedHtml(config, items);
  const psCode = generatePowerShellScript(config, items);
  const reactCode = generateReactCode(config, items);
  const jsonCode = JSON.stringify({ config, items }, null, 2);

  const currentCode = 
    activeTab === 'agent' ? agentBatCode :
    activeTab === 'ultra' ? ultraBatCode :
    activeTab === 'html' ? htmlCode :
    activeTab === 'powershell' ? psCode :
    activeTab === 'react' ? reactCode : jsonCode;

  const handleCopy = () => {
    soundFX.playClick();
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingle = () => {
    soundFX.playClick();
    const filename = 
      activeTab === 'agent' ? 'Iniciar_Agente_Windows.bat' :
      activeTab === 'ultra' ? 'Iniciar_AuraDock.bat' :
      activeTab === 'html' ? 'AuraDock_Desktop.html' :
      activeTab === 'powershell' ? 'AuraDock.ps1' :
      activeTab === 'react' ? 'LateralDock.tsx' : 'auradock-config.json';
    
    downloadFile(filename, currentCode);
  };

  const handleDownloadAgent = () => {
    soundFX.playComplete();
    downloadFile('Iniciar_Agente_Windows.bat', agentBatCode);
    setPackDownloaded(true);
    setTimeout(() => setPackDownloaded(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0f1118] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Agente de Bandeja do Windows (Electron)</h2>
              <p className="text-xs text-zinc-400">
                Menu lateral transparente na tela com controle silencioso pela bandeja do sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Banner: Agente de Bandeja */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-black/60 border-b border-indigo-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Agente de Bandeja + Janela Transparente</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">Ativo no Projeto</span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Fica na bandeja (perto do relógio). Quando quiser editar, abre o configurador, salva e ele volta direto para a bandeja!
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadAgent}
            className="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            {packDownloaded ? (
              <>
                <PackageCheck className="w-4 h-4 text-white" />
                <span>Baixado!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar Iniciar_Agente.bat</span>
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-white/[0.08] bg-white/[0.01] overflow-x-auto">
          <button
            onClick={() => setActiveTab('agent')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'agent'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Agente Electron (Bandeja)
          </button>

          <button
            onClick={() => setActiveTab('ultra')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'ultra'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Modo App Direto
          </button>

          <button
            onClick={() => setActiveTab('html')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'html'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            HTML Standalone
          </button>

          <button
            onClick={() => setActiveTab('powershell')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'powershell'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            PowerShell WPF
          </button>

          <button
            onClick={() => setActiveTab('react')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'react'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            React
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            JSON
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'agent' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-zinc-300 space-y-2">
                <span className="font-semibold text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  Como funciona o Agente no seu Windows:
                </span>
                <p>
                  O Electron foi configurado diretamente no projeto para funcionar exatamente como um agente de sistema nativo:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                    <span className="font-bold text-white text-xs block">1. Fica na Bandeja</span>
                    <span className="text-[11px] text-zinc-400 block">
                      Ao iniciar, um ícone fica perto do relógio do Windows rodando em segundo plano.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                    <span className="font-bold text-white text-xs block">2. Atalho Ctrl + Espaço</span>
                    <span className="text-[11px] text-zinc-400 block">
                      Pressione a qualquer momento para abrir ou fechar o menu flutuante transparente na lateral da tela.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                    <span className="font-bold text-white text-xs block">3. Edite e Volte</span>
                    <span className="text-[11px] text-zinc-400 block">
                      Abra as configurações pela bandeja, faça suas alterações e clique em "Salvar e Recolher". Ele atualiza na hora e volta para a bandeja!
                    </span>
                  </div>
                </div>
              </div>

              {/* Code Box */}
              <div className="relative">
                <div className="text-xs text-zinc-400 mb-1 font-mono">Iniciar_Agente_Windows.bat ou "npm run start:agent"</div>
                <pre className="p-4 rounded-xl bg-[#08090e] border border-white/10 text-zinc-300 font-mono text-xs overflow-x-auto max-h-[300px] leading-relaxed">
                  <code>{currentCode}</code>
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-8 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-medium transition-all flex items-center gap-1.5 backdrop-blur-md"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-300" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <pre className="p-4 rounded-xl bg-[#08090e] border border-white/10 text-zinc-300 font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed">
                <code>{currentCode}</code>
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-medium transition-all flex items-center gap-1.5 backdrop-blur-md"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-white/[0.02]">
          <span className="text-xs text-zinc-500">
            Agente nativo com persistência em <b>%APPDATA%/auradock-config.json</b>
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleDownloadSingle}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo da Aba Atual</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
