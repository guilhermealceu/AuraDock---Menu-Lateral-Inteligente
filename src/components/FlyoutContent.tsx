import React, { useState, useEffect } from 'react';
import { 
  DockItem, 
  TaskItem, 
  AgendaEvent, 
  RecentDoc, 
  DockConfig, 
  DockShape, 
  DockTheme 
} from '../types/dock';
import { SHAPE_METADATA } from '../utils/geometry';
import { soundFX } from '../utils/sound';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar as CalendarIcon, 
  FileText, 
  Upload, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Code, 
  Sparkles, 
  Play, 
  Pause,
  ExternalLink,
  Laptop,
  Activity,
  HardDrive
} from 'lucide-react';

interface FlyoutContentProps {
  item: DockItem;
  config: DockConfig;
  onUpdateConfig: (partial: Partial<DockConfig>) => void;
  onOpenExportModal: () => void;
  onClose: () => void;
}

export const FlyoutContent: React.FC<FlyoutContentProps> = ({
  item,
  config,
  onUpdateConfig,
  onOpenExportModal,
  onClose,
}) => {
  // --- INÍCIO STATE ---
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [dndMode, setDndMode] = useState<boolean>(false);
  const [systemLoad, setSystemLoad] = useState({ cpu: 28, ram: 54, ping: 12 });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadInterval = setInterval(() => {
      setSystemLoad({
        cpu: Math.floor(22 + Math.random() * 16),
        ram: 54,
        ping: Math.floor(10 + Math.random() * 8),
      });
    }, 3000);
    return () => clearInterval(loadInterval);
  }, []);

  // --- PROJETOS STATE ---
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', title: 'Revisar curvas Bézier do AuraDock', completed: true, priority: 'alta', dueTime: 'Hoje' },
    { id: '2', title: 'Ajustar layout e atalhos rápidos', completed: false, priority: 'alta', dueTime: '15:30' },
    { id: '3', title: 'Finalizar documentação do script PowerShell', completed: false, priority: 'media', dueTime: 'Amanhã' },
    { id: '4', title: 'Testar gatilho de borda no monitor ultrawide', completed: false, priority: 'baixa', dueTime: 'Sexta' },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'done'>('all');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    soundFX.playClick();
    const newTask: TaskItem = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      priority: 'media',
      dueTime: 'Hoje',
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    soundFX.playComplete();
    setTasks(tasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    soundFX.playClick();
    setTasks(tasks.filter(t => t.id !== id));
  };

  // --- AGENDA STATE ---
  const [events, setEvents] = useState<AgendaEvent[]>([
    { id: '1', time: '14:00 - 15:00', title: 'Alinhamento UI/UX da Dock Lateral', category: 'Reunião', location: 'Google Meet' },
    { id: '2', time: '16:00 - 17:30', title: 'Deploy da versão preview & testes de borda', category: 'Trabalho', location: 'Dev Room' },
    { id: '3', time: '18:30 - 19:15', title: 'Treino Funcional / Pausa Ativa', category: 'Pessoal', location: 'Academia' },
  ]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('17:00');
  const [showAddEvent, setShowAddEvent] = useState(false);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    soundFX.playClick();
    setEvents([
      ...events,
      {
        id: Date.now().toString(),
        time: newEventTime,
        title: newEventTitle.trim(),
        category: 'Trabalho',
        location: 'Online',
      },
    ]);
    setNewEventTitle('');
    setShowAddEvent(false);
  };

  // --- ARQUIVOS STATE ---
  const [recentDocs, setRecentDocs] = useState<RecentDoc[]>([
    { id: '1', name: 'dock_lateral_wpf.ps1', size: '4.8 KB', ext: 'PS1', modified: 'Hoje, 11:20' },
    { id: '2', name: 'design_specs_auradock.pdf', size: '2.1 MB', ext: 'PDF', modified: 'Ontem' },
    { id: '3', name: 'DockSilhouette.tsx', size: '3.4 KB', ext: 'TSX', modified: 'Hoje, 10:45' },
    { id: '4', name: 'paleta_cores_dark.json', size: '890 B', ext: 'JSON', modified: '23 Set' },
  ]);
  const [fileMessage, setFileMessage] = useState<string | null>(null);

  const handleSimulateDrop = (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    soundFX.playClick();
    setFileMessage('Arquivo adicionado aos recentes!');
    setTimeout(() => setFileMessage(null), 3000);
  };

  // --- NOTAS RÁPIDAS STATE ---
  const [scratchpad, setScratchpad] = useState<string>(() => {
    return localStorage.getItem('auradock_notes') || 'Ideias para o Dock Lateral:\n- Atalho Ctrl + Espaço para alternar visibilidade instantânea\n- Curvatura dinâmica ajustável por slider\n- Formas orgânicas com SVG Bézier matematicamente equilibradas';
  });
  const [copied, setCopied] = useState(false);

  const handleNotesChange = (text: string) => {
    setScratchpad(text);
    localStorage.setItem('auradock_notes', text);
  };

  const handleCopyNotes = () => {
    soundFX.playClick();
    navigator.clipboard.writeText(scratchpad);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- POMODORO TIMER STATE ---
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      soundFX.playComplete();
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render content according to clicked item
  switch (item.id) {
    case 'home':
      return (
        <div className="space-y-4">
          {/* Header & Clock */}
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
                {currentTime || '12:00:00'}
              </div>
              <div className="text-xs text-zinc-400 capitalize">{currentDate}</div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Dock Ativo
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5">Ctrl + Espaço</span>
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundFX.playClick();
                setFocusMode(!focusMode);
              }}
              className={`p-2.5 rounded-xl text-left transition-all border ${
                focusMode 
                  ? 'bg-purple-900/30 border-purple-500/40 text-purple-200' 
                  : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] uppercase font-semibold text-zinc-400">
                  {focusMode ? 'Ligado' : 'Desligado'}
                </span>
              </div>
              <div className="text-xs font-semibold mt-1.5">Modo Foco</div>
              <div className="text-[10px] text-zinc-400 truncate">Sem distrações</div>
            </button>

            <button
              onClick={() => {
                soundFX.playClick();
                setDndMode(!dndMode);
              }}
              className={`p-2.5 rounded-xl text-left transition-all border ${
                dndMode 
                  ? 'bg-amber-900/30 border-amber-500/40 text-amber-200' 
                  : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between">
                <VolumeX className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] uppercase font-semibold text-zinc-400">
                  {dndMode ? 'Silêncio' : 'Normal'}
                </span>
              </div>
              <div className="text-xs font-semibold mt-1.5">Não Perturbe</div>
              <div className="text-[10px] text-zinc-400 truncate">Silenciar alertas</div>
            </button>
          </div>

          {/* Pomodoro Quick Widget */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-xs font-semibold text-white">Timer de Foco</div>
                <div className="text-sm font-mono font-bold text-indigo-300 tabular-nums">
                  {formatTimer(timerSeconds)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  soundFX.playClick();
                  setTimerRunning(!timerRunning);
                }}
                className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                title={timerRunning ? 'Pausar' : 'Iniciar'}
              >
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  soundFX.playClick();
                  setTimerRunning(false);
                  setTimerSeconds(25 * 60);
                }}
                className="px-2 py-1 text-[10px] rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* System Performance Monitors */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-medium text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-zinc-400" />
                Desempenho do Sistema
              </span>
              <span className="font-mono text-[10px] text-zinc-500">60 FPS</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[10px] text-zinc-400">CPU</div>
                <div className="text-xs font-mono font-bold text-zinc-200 tabular-nums mt-0.5">
                  {systemLoad.cpu}%
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${systemLoad.cpu}%` }}
                  />
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[10px] text-zinc-400">RAM</div>
                <div className="text-xs font-mono font-bold text-zinc-200 tabular-nums mt-0.5">
                  {systemLoad.ram}%
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${systemLoad.ram}%` }}
                  />
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[10px] text-zinc-400">Latência</div>
                <div className="text-xs font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
                  {systemLoad.ping}ms
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-emerald-500 w-1/4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'projects':
      const completedCount = tasks.filter(t => t.completed).length;
      const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
      const filteredTasks = tasks.filter(t => {
        if (taskFilter === 'pending') return !t.completed;
        if (taskFilter === 'done') return t.completed;
        return true;
      });

      return (
        <div className="space-y-3.5">
          {/* Progress bar */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-300 mb-1.5">
              <span>Progresso das Tarefas</span>
              <span className="font-mono text-emerald-400 tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2">
              <span>{completedCount} de {tasks.length} concluídas</span>
              <span>Prioridades ativas</span>
            </div>
          </div>

          {/* Filter segment */}
          <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-lg border border-white/[0.06]">
            {(['all', 'pending', 'done'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  soundFX.playClick();
                  setTaskFilter(tab);
                }}
                className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all ${
                  taskFilter === tab
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab === 'all' ? 'Todas' : tab === 'pending' ? 'Pendentes' : 'Concluídas'}
              </button>
            ))}
          </div>

          {/* Add task input */}
          <form onSubmit={handleAddTask} className="flex gap-1.5">
            <input
              type="text"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="Adicionar nova tarefa..."
              className="flex-1 px-3 py-1.5 text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs transition-colors flex items-center justify-center border border-white/10"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Task list */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400">
                Nenhuma tarefa encontrada neste filtro.
              </div>
            ) : (
              filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`group p-2.5 rounded-lg flex items-center justify-between border transition-all ${
                    task.completed 
                      ? 'bg-white/[0.01] border-white/[0.03] text-zinc-500' 
                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-200 hover:bg-white/[0.05]'
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center gap-2.5 text-left flex-1"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-500 group-hover:text-zinc-400 shrink-0" />
                    )}
                    <span className={`text-xs ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                      {task.title}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-zinc-400 font-mono">{task.dueTime}</span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );

    case 'agenda':
      return (
        <div className="space-y-3.5">
          {/* Next event spotlight */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 to-purple-950/20 border border-indigo-500/20">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400 flex items-center justify-between">
              <span>Próximo Compromisso</span>
              <span className="font-mono text-indigo-300">Hoje às 14:00</span>
            </div>
            <div className="text-sm font-semibold text-white mt-1">
              Alinhamento UI/UX da Dock Lateral
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Google Meet · Participantes confirmados
            </div>
          </div>

          {/* Agenda Items list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
              <span>Compromissos de Hoje</span>
              <button
                onClick={() => setShowAddEvent(!showAddEvent)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {showAddEvent ? 'Cancelar' : 'Adicionar'}
              </button>
            </div>

            {showAddEvent && (
              <form onSubmit={handleAddEvent} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  placeholder="Nome do compromisso..."
                  className="w-full px-2.5 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
                />
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={e => setNewEventTime(e.target.value)}
                    className="px-2 py-1 text-xs bg-black/40 border border-white/10 rounded-lg text-white"
                  />
                  <button
                    type="submit"
                    className="flex-1 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    Salvar Evento
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {events.map(ev => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all flex items-start justify-between"
                >
                  <div>
                    <div className="text-xs font-medium text-zinc-200">{ev.title}</div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{ev.time}</span>
                      <span>·</span>
                      <span>{ev.location}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-medium">
                    {ev.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'files':
      return (
        <div className="space-y-3.5">
          {/* Dropzone */}
          <label 
            onDragOver={e => e.preventDefault()}
            onDrop={handleSimulateDrop}
            className="border border-dashed border-white/15 hover:border-white/30 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04]"
          >
            <Upload className="w-5 h-5 text-zinc-400 mb-1.5" />
            <span className="text-xs font-medium text-zinc-200">Arraste arquivos aqui</span>
            <span className="text-[10px] text-zinc-400 mt-0.5">ou clique para adicionar ao painel</span>
            <input type="file" onChange={handleSimulateDrop} className="hidden" />
          </label>

          {fileMessage && (
            <div className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2 text-center animate-fade-in">
              {fileMessage}
            </div>
          )}

          {/* Recent files list */}
          <div>
            <div className="text-xs font-semibold text-zinc-300 mb-2">Arquivos Recentes</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {recentDocs.map(doc => (
                <div
                  key={doc.id}
                  className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono font-bold text-zinc-300 flex items-center justify-center shrink-0">
                      {doc.ext}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-200 truncate">{doc.name}</div>
                      <div className="text-[10px] text-zinc-400">
                        {doc.size} · {doc.modified}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      alert(`Abrindo "${doc.name}"...`);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Abrir"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'notes':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="font-semibold">Bloco de Notas Rápido</span>
            <span className="text-[11px] text-zinc-400">{scratchpad.length} caracteres</span>
          </div>

          <textarea
            value={scratchpad}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Digite anotações rápidas..."
            className="w-full h-40 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 resize-none font-sans leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-zinc-400">Salvo automaticamente</span>
            <button
              onClick={handleCopyNotes}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>
          </div>
        </div>
      );

    case 'settings':
    default:
      return (
        <div className="space-y-4 text-left">
          {/* Quick status summary */}
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Silhueta Ativa</span>
              <span className="text-white font-medium">{SHAPE_METADATA[config.shape]?.label || 'Gota Suave'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Posição</span>
              <span className="text-white font-medium">{config.position === 'right' ? 'Borda Direita' : 'Borda Esquerda'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Modo de Expansão</span>
              <span className="text-indigo-300 font-medium">
                {config.displayMode === 'morph' ? 'Morphing Expansivo' : 'Card Flutuante'}
              </span>
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundFX.playClick();
                onUpdateConfig({ position: config.position === 'right' ? 'left' : 'right' });
              }}
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-colors"
            >
              <div className="text-[10px] uppercase font-semibold text-zinc-400">Mudar Lado</div>
              <div className="text-xs font-medium text-white mt-0.5">
                {config.position === 'right' ? 'Mover p/ Esquerda' : 'Mover p/ Direita'}
              </div>
            </button>

            <button
              onClick={() => {
                soundFX.playClick();
                onUpdateConfig({ displayMode: config.displayMode === 'morph' ? 'flyout' : 'morph' });
              }}
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-colors"
            >
              <div className="text-[10px] uppercase font-semibold text-zinc-400">Alternar Modo</div>
              <div className="text-xs font-medium text-white mt-0.5">
                {config.displayMode === 'morph' ? 'Card Flutuante' : 'Morphing'}
              </div>
            </button>
          </div>

          {/* Main Action: Configure on Central Page */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-center space-y-2">
            <div className="text-xs font-semibold text-white">Configurações no Painel da Página</div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              O estúdio completo com formas, temas, curvatura e itens fica aberto na página principal para maior conforto.
            </p>
            <button
              onClick={() => {
                soundFX.playClose();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm"
            >
              Usar Painel da Página
            </button>
          </div>

          {/* Export Code Shortcut */}
          <button
            onClick={() => {
              soundFX.playClick();
              onOpenExportModal();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors"
          >
            <Code className="w-3.5 h-3.5 text-indigo-400" />
            Exportar / Baixar para Windows
          </button>
        </div>
      );
  }
};
