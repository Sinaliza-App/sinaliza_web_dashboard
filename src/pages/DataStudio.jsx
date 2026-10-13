import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { 
  Camera, CheckCircle, XCircle, Edit3, Download, RefreshCw, 
  Layers, Video, BarChart3, Sparkles, AlertCircle, Play, RotateCcw, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DataStudio() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('curadoria'); // 'curadoria', 'gravacao', 'metricas'
  
  // --- Estados da Curadoria ---
  const [samples, setSamples] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pendente'); // 'pendente', 'validado', 'rejeitado', 'all'
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [curationError, setCurationError] = useState('');
  const [editingSample, setEditingSample] = useState(null);
  const [correctedSignInput, setCorrectedSignInput] = useState('');

  // --- Estados do Estúdio de Gravação Web ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [targetSign, setTargetSign] = useState('bom_dia');
  const [recordMode, setRecordMode] = useState('dinamico'); // 'dinamico' (30) ou 'alfabeto' (20)
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordedFramesCount, setRecordedFramesCount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [studioFeedback, setStudioFeedback] = useState({ type: '', message: '' });

  // Refs de controle de captura
  const recordingStateRef = useRef({
    isRecording: false,
    buffer: [],
    targetFrames: 30,
    targetSign: 'bom_dia',
    recordMode: 'dinamico'
  });
  const cameraInstanceRef = useRef(null);
  const holisticInstanceRef = useRef(null);

  // --- Estados de Métricas e Exportação ---
  const [stats, setStats] = useState({ overview: {}, per_sign: [] });
  const [loadingStats, setLoadingStats] = useState(false);

  // Lista de sinais sugeridos
  const standardSigns = [
    'a', 'b', 'c', 'd', 'e', 'l', 'v', 'y',
    'bom_dia', 'boa_tarde', 'boa_noite', 'obrigado', 'por_favor',
    'ajuda', 'com_licenca', 'amigo', 'aprender', 'libras', 'sinaliza'
  ];

  // 1. CARREGAR AMOSTRAS DA CURADORIA
  const fetchSamples = useCallback(async () => {
    setLoadingSamples(true);
    setCurationError('');
    try {
      const response = await api.get(`/coleta/amostras?status=${statusFilter}&limit=100`);
      setSamples(response.data || []);
    } catch (err) {
      console.error('Erro ao buscar amostras:', err);
      setCurationError('Não foi possível carregar as amostras. Verifique a conexão com o backend.');
    } finally {
      setLoadingSamples(false);
    }
  }, [statusFilter]);

  // 2. CARREGAR ESTATÍSTICAS
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await api.get('/coleta/stats');
      setStats(response.data || { overview: {}, per_sign: [] });
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'curadoria') fetchSamples();
    if (activeTab === 'metricas') fetchStats();
  }, [activeTab, fetchSamples, fetchStats]);

  // AÇÕES DE CURADORIA
  const handleEvaluate = async (sampleId, newStatus, corrected = null) => {
    try {
      await api.patch(`/coleta/amostras/${sampleId}/avaliar`, {
        status: newStatus,
        corrected_sign: corrected
      });
      // Atualiza lista local
      setSamples(prev => prev.map(s => s.id === sampleId ? { ...s, status: newStatus, corrected_sign: corrected || s.corrected_sign } : s));
      setEditingSample(null);
    } catch (err) {
      console.error('Erro ao avaliar amostra:', err);
      alert('Erro ao registrar avaliação da amostra.');
    }
  };

  // EXPORTAR MANIFESTO DO DATASET
  const handleExportManifest = async () => {
    try {
      const response = await api.get('/coleta/exportar-manifesto');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sinaliza_dataset_valido_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar dataset:', err);
      alert('Falha ao exportar manifesto do dataset.');
    }
  };

  // =========================================================================
  // MOTOR DE CAPTURA COM WEBCAM & MEDIAPIPE HOLISTIC
  // =========================================================================

  const distance3D = (x1, y1, z1, x2, y2, z2) => {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);
  };

  const extractFeatures = (results) => {
    const features = new Array(258).fill(0.0);
    if (results.poseLandmarks) {
      for (let i = 0; i < 33; i++) {
        const lm = results.poseLandmarks[i];
        features[i * 4] = lm.x;
        features[(i * 4) + 1] = lm.y;
        features[(i * 4) + 2] = lm.z;
        features[(i * 4) + 3] = lm.visibility || 0;
      }
    }
    if (results.leftHandLandmarks) {
      for (let i = 0; i < 21; i++) {
        const lm = results.leftHandLandmarks[i];
        features[132 + (i * 3)] = lm.x;
        features[132 + (i * 3) + 1] = lm.y;
        features[132 + (i * 3) + 2] = lm.z;
      }
    }
    if (results.rightHandLandmarks) {
      for (let i = 0; i < 21; i++) {
        const lm = results.rightHandLandmarks[i];
        features[195 + (i * 3)] = lm.x;
        features[195 + (i * 3) + 1] = lm.y;
        features[195 + (i * 3) + 2] = lm.z;
      }
    }

    // Normalização relativa (mesmo algoritmo do backend / cv_utils.py)
    const normalizeHand = (startIdx) => {
      let hasHand = false;
      for (let i = 0; i < 21; i++) { if (features[startIdx + i * 3] !== 0) hasHand = true; }
      if (hasHand) {
        const wristX = features[startIdx], wristY = features[startIdx + 1], wristZ = features[startIdx + 2];
        const mcpX = features[startIdx + 9 * 3], mcpY = features[startIdx + 9 * 3 + 1], mcpZ = features[startIdx + 9 * 3 + 2];
        const handSize = distance3D(wristX, wristY, wristZ, mcpX, mcpY, mcpZ);
        const scale = handSize > 1e-5 ? handSize : 1.0;
        for (let i = 0; i < 21; i++) {
          features[startIdx + i * 3] = (features[startIdx + i * 3] - wristX) / scale;
          features[startIdx + i * 3 + 1] = (features[startIdx + i * 3 + 1] - wristY) / scale;
          features[startIdx + i * 3 + 2] = (features[startIdx + i * 3 + 2] - wristZ) / scale;
        }
      }
    };
    normalizeHand(132);
    normalizeHand(195);
    return features;
  };

  // Inicializa câmera ao entrar na aba de Gravação
  useEffect(() => {
    if (activeTab !== 'gravacao') {
      if (cameraInstanceRef.current) {
        cameraInstanceRef.current.stop();
        cameraInstanceRef.current = null;
      }
      setCameraActive(false);
      return;
    }

    let isMounted = true;

    const startWebcam = async () => {
      if (!window.Holistic || !window.Camera) {
        setStudioFeedback({ type: 'error', message: 'Bibliotecas MediaPipe não carregadas no navegador.' });
        return;
      }

      try {
        const holistic = new window.Holistic({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
        });

        holistic.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
          selfieMode: true
        });

        holistic.onResults((results) => {
          if (!isMounted) return;

          // Desenho do esqueleto no canvas
          const canvasCtx = canvasRef.current?.getContext('2d');
          if (canvasCtx && canvasRef.current) {
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            if (results.poseLandmarks && window.drawConnectors) {
              window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS, { color: '#00FF9D', lineWidth: 2 });
              window.drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#00F0FF', lineWidth: 1, radius: 2 });
            }
            if (results.leftHandLandmarks && window.drawConnectors) {
              window.drawConnectors(canvasCtx, results.leftHandLandmarks, window.HAND_CONNECTIONS, { color: '#10B981', lineWidth: 2 });
            }
            if (results.rightHandLandmarks && window.drawConnectors) {
              window.drawConnectors(canvasCtx, results.rightHandLandmarks, window.HAND_CONNECTIONS, { color: '#10B981', lineWidth: 2 });
            }
            canvasCtx.restore();
          }

          // Se estiver gravando ativamente:
          if (recordingStateRef.current.isRecording) {
            const frameVector = extractFeatures(results);
            recordingStateRef.current.buffer.push(frameVector);
            const currentLen = recordingStateRef.current.buffer.length;
            setRecordedFramesCount(currentLen);

            if (currentLen >= recordingStateRef.current.targetFrames) {
              finishRecording();
            }
          }
        });

        holisticInstanceRef.current = holistic;

        if (videoRef.current) {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && holisticInstanceRef.current) {
                await holisticInstanceRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          await camera.start();
          cameraInstanceRef.current = camera;
          if (isMounted) setCameraActive(true);
        }
      } catch (e) {
        console.error('Erro na câmera MediaPipe:', e);
        if (isMounted) setStudioFeedback({ type: 'error', message: 'Erro ao abrir webcam: ' + e.message });
      }
    };

    startWebcam();

    return () => {
      isMounted = false;
      if (cameraInstanceRef.current) {
        cameraInstanceRef.current.stop();
        cameraInstanceRef.current = null;
      }
    };
  }, [activeTab]);

  // DISPARAR GRAVAÇÃO COM CONTAGEM REGRESSIVA
  const handleStartRecording = () => {
    if (isRecording || countdown > 0) return;
    setStudioFeedback({ type: '', message: '' });
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          beginCapture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginCapture = () => {
    const framesNeeded = recordMode === 'alfabeto' ? 20 : 30;
    recordingStateRef.current = {
      isRecording: true,
      buffer: [],
      targetFrames: framesNeeded,
      targetSign: targetSign,
      recordMode: recordMode
    };
    setIsRecording(true);
    setRecordedFramesCount(0);
  };

  const finishRecording = async () => {
    recordingStateRef.current.isRecording = false;
    setIsRecording(false);
    const capturedData = [...recordingStateRef.current.buffer];

    setStudioFeedback({ type: 'info', message: 'Salvando amostra validada no servidor...' });

    try {
      const response = await api.post('/coleta/amostra', {
        sign_name: recordingStateRef.current.targetSign,
        mode: recordingStateRef.current.recordMode,
        raw_landmarks: capturedData,
        source: 'web_studio',
        reporter_role: 'professor'
      });

      setStudioFeedback({ 
        type: 'success', 
        message: `Sinal "${recordingStateRef.current.targetSign}" gravado com sucesso! Amostra #${response.data.sample_id} validada.` 
      });
    } catch (err) {
      console.error('Erro ao salvar gravação:', err);
      setStudioFeedback({ type: 'error', message: 'Erro ao enviar amostra para o servidor.' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in bg-slate-950 min-h-screen text-slate-100 font-sans p-8 flex-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Estúdio de Coleta & Curadoria de IA
          </h1>
          <p className="text-slate-400 mt-2">
            Pipeline MLOps de LIBRAS: valide amostras enviadas por alunos e grave novos sinais via webcam.
          </p>
        </div>

        {activeTab === 'metricas' && (
          <button
            onClick={handleExportManifest}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
          >
            <Download size={18} />
            <span>Exportar Dataset (JSON)</span>
          </button>
        )}
      </div>

      {/* Tabs Principais */}
      <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <button
          onClick={() => setActiveTab('curadoria')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'curadoria'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Layers size={18} />
          <span>Curadoria de Alunos</span>
        </button>

        <button
          onClick={() => setActiveTab('gravacao')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'gravacao'
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Video size={18} />
          <span>Gravação Web (Data Studio)</span>
        </button>

        <button
          onClick={() => setActiveTab('metricas')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'metricas'
              ? 'bg-purple-500 text-slate-950 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <BarChart3 size={18} />
          <span>Métricas do Dataset</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: CURADORIA DE AMOSTRAS RECEBIDAS (ALUNOS) */}
      {/* ========================================================================= */}
      {activeTab === 'curadoria' && (
        <div className="space-y-6">
          {/* Filtros de Status */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <div className="flex gap-2">
              {[
                { id: 'pendente', label: 'Pendentes de Revisão' },
                { id: 'validado', label: 'Validadas' },
                { id: 'rejeitado', label: 'Rejeitadas' },
                { id: 'all', label: 'Todas as Amostras' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === f.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchSamples}
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors p-2"
            >
              <RefreshCw size={14} className={loadingSamples ? 'animate-spin' : ''} />
              <span>Atualizar Fila</span>
            </button>
          </div>

          {curationError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-2xl flex items-center gap-3">
              <AlertCircle size={20} />
              <span>{curationError}</span>
            </div>
          )}

          {/* Tabela de Amostras */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
            {loadingSamples ? (
              <div className="p-16 text-center text-cyan-400 flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 font-bold text-sm tracking-wider">CARREGANDO AMOSTRAS...</p>
              </div>
            ) : samples.length === 0 ? (
              <div className="p-16 text-center text-slate-500">
                <CheckCircle size={40} className="mx-auto mb-3 opacity-40 text-emerald-400" />
                <p className="text-lg font-medium text-slate-300">Nenhuma amostra encontrada neste filtro.</p>
                <p className="text-sm text-slate-500 mt-1">A fila de curadoria está em dia!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-xs uppercase tracking-wider">
                      <th className="p-4">ID</th>
                      <th className="p-4">Sinal Pretendido</th>
                      <th className="p-4">Modo</th>
                      <th className="p-4">Autor / Aluno</th>
                      <th className="p-4">Frames</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Data</th>
                      <th className="p-4 text-center">Ações de Curadoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {samples.map((sample) => (
                      <tr key={sample.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-slate-500 font-mono">#{sample.id}</td>
                        <td className="p-4 font-bold text-slate-100">
                          <span className="text-cyan-400">{sample.sign_name}</span>
                          {sample.corrected_sign && sample.corrected_sign !== sample.sign_name && (
                            <span className="ml-2 text-xs font-normal text-emerald-400">
                              (Corrigido: {sample.corrected_sign})
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono">
                            {sample.mode}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-300">{sample.student_name || 'Aluno App'}</div>
                          <div className="text-xs text-slate-500">{sample.student_email || 'Mobile'}</div>
                        </td>
                        <td className="p-4 font-mono text-slate-400">
                          {sample.frame_count || 30} pts
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            sample.status === 'validado'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : sample.status === 'rejeitado'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          }`}>
                            {sample.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {new Date(sample.created_at).toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {sample.status !== 'validado' && (
                              <button
                                onClick={() => handleEvaluate(sample.id, 'validado')}
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                title="Aprovar e incorporar ao dataset de treino"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingSample(sample);
                                setCorrectedSignInput(sample.corrected_sign || sample.sign_name);
                              }}
                              className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors"
                              title="Corrigir classe do sinal"
                            >
                              <Edit3 size={16} />
                            </button>
                            {sample.status !== 'rejeitado' && (
                              <button
                                onClick={() => handleEvaluate(sample.id, 'rejeitado')}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                                title="Rejeitar amostra (ruído ou incorreto)"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PARA CORRIGIR CLASSE DA AMOSTRA */}
      {editingSample && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Corrigir Sinal da Amostra #{editingSample.id}</h3>
            <p className="text-slate-400 text-xs mb-4">
              Se o aluno pretendia fazer um sinal mas executou outro gesto válido, corrija o rótulo antes de validar:
            </p>
            <input
              type="text"
              value={correctedSignInput}
              onChange={(e) => setCorrectedSignInput(e.target.value)}
              placeholder="Nome correto do sinal (ex: bom_dia, comer)"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white mb-4 focus:ring-2 focus:ring-cyan-500 outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingSample(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEvaluate(editingSample.id, 'validado', correctedSignInput)}
                className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-cyan-400"
              >
                Salvar & Validar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: ESTÚDIO DE GRAVAÇÃO WEB (DATA STUDIO COM WEBCAM) */}
      {/* ========================================================================= */}
      {activeTab === 'gravacao' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Câmera e Canvas */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl relative flex flex-col items-center">
            <div className="relative w-full max-w-[640px] aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* Overlay de Contagem Regressiva */}
              <AnimatePresence>
                {countdown > 0 && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                  >
                    <div className="text-8xl font-black text-cyan-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.8)]">
                      {countdown}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Indicador de Gravando */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-rose-600/90 text-white px-3 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider animate-pulse shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                  <span>GRAVANDO ({recordedFramesCount}/{recordMode === 'alfabeto' ? 20 : 30})</span>
                </div>
              )}

              {/* Badge de Status da Câmera */}
              <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/50 text-xs flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                <span className="text-slate-300">{cameraActive ? 'MediaPipe Holistic 60 FPS Ativo' : 'Iniciando câmera...'}</span>
              </div>
            </div>

            {/* Barra de Progresso de Frames */}
            {isRecording && (
              <div className="w-full max-w-[640px] mt-4">
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-2.5 rounded-full transition-all duration-75"
                    style={{ width: `${(recordedFramesCount / (recordMode === 'alfabeto' ? 20 : 30)) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Painel de Controle de Gravação */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-emerald-400" size={20} />
                  <span>Configuração do Sinal</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione o sinal de LIBRAS que você irá gravar como referência docente.
                </p>
              </div>

              {/* Modo de Gravação */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Tipo de Sinal</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => { setRecordMode('dinamico'); recordingStateRef.current.recordMode = 'dinamico'; }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      recordMode === 'dinamico' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Expressão (30 frames)
                  </button>
                  <button
                    onClick={() => { setRecordMode('alfabeto'); recordingStateRef.current.recordMode = 'alfabeto'; }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      recordMode === 'alfabeto' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Alfabeto (20 frames)
                  </button>
                </div>
              </div>

              {/* Seleção do Sinal */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Sinal Alvo</label>
                <input
                  type="text"
                  value={targetSign}
                  onChange={(e) => {
                    setTargetSign(e.target.value.toLowerCase().trim());
                    recordingStateRef.current.targetSign = e.target.value.toLowerCase().trim();
                  }}
                  placeholder="Nome do sinal (ex: bom_dia)"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />

                {/* Chips rápidos */}
                <div className="flex flex-wrap gap-1.5 mt-3 max-h-32 overflow-y-auto pr-1">
                  {standardSigns.map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setTargetSign(s);
                        recordingStateRef.current.targetSign = s;
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        targetSign === s
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                          : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Message */}
              {studioFeedback.message && (
                <div className={`p-4 rounded-2xl text-xs font-medium border ${
                  studioFeedback.type === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : studioFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                }`}>
                  {studioFeedback.message}
                </div>
              )}
            </div>

            {/* Botão de Disparo */}
            <button
              onClick={handleStartRecording}
              disabled={isRecording || countdown > 0 || !cameraActive}
              className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20 active:scale-95 disabled:opacity-50'
              }`}
            >
              {isRecording ? (
                <span>GRAVANDO SEQUÊNCIA...</span>
              ) : countdown > 0 ? (
                <span>PREPARE-SE ({countdown})...</span>
              ) : (
                <>
                  <Play size={20} fill="currentColor" />
                  <span>INICIAR GRAVAÇÃO DOCENTE</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: MÉTRICAS DO DATASET & METAS DE TREINAMENTO V2 */}
      {/* ========================================================================= */}
      {activeTab === 'metricas' && (
        <div className="space-y-8">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Amostras Coletadas</span>
              <div className="text-3xl font-black text-white mt-2">{stats.overview?.total_samples || 0}</div>
              <span className="text-xs text-slate-500 mt-1 block">Total no banco de dados</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Aguardando Curadoria</span>
              <div className="text-3xl font-black text-amber-300 mt-2">{stats.overview?.pending_count || 0}</div>
              <span className="text-xs text-slate-500 mt-1 block">Amostras enviadas por alunos</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Amostras Validadas</span>
              <div className="text-3xl font-black text-emerald-400 mt-2">{stats.overview?.validated_count || 0}</div>
              <span className="text-xs text-slate-500 mt-1 block">Prontas para retreino V2</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
              <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Classes em Coleta</span>
              <div className="text-3xl font-black text-cyan-400 mt-2">{stats.per_sign?.length || 0}</div>
              <span className="text-xs text-slate-500 mt-1 block">Sinais com registros</span>
            </div>
          </div>

          {/* Progresso por Sinal */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={22} />
              <span>Progresso de Metas por Sinal (Meta: 30 amostras validadas)</span>
            </h3>

            {loadingStats ? (
              <div className="py-12 text-center text-slate-400">Carregando métricas...</div>
            ) : stats.per_sign?.length === 0 ? (
              <div className="py-12 text-center text-slate-500">Nenhum sinal com amostras cadastradas ainda.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.per_sign?.map((item) => {
                  const targetMeta = 30;
                  const progressPct = Math.min(100, Math.round((item.validated_samples / targetMeta) * 100));

                  return (
                    <div key={item.sign_name} className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white uppercase text-sm">{item.sign_name}</span>
                        <span className="text-xs font-mono text-cyan-400">
                          {item.validated_samples}/{targetMeta}
                        </span>
                      </div>

                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progressPct >= 100 ? 'bg-emerald-400' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{item.pending_samples} pendentes</span>
                        <span>{progressPct >= 100 ? '✅ Meta Atingida' : `${100 - progressPct}% restante`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
