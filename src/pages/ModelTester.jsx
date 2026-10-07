import { useEffect, useRef, useState } from 'react';

const ModelTester = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [activeMode, setActiveMode] = useState('lstm');
  const activeModeRef = useRef('lstm');

  const [prediction, setPrediction] = useState('--');
  const [confidence, setConfidence] = useState(0);
  const [logs, setLogs] = useState(["[INFO] Inicializando laboratório local..."]);
  const [status, setStatus] = useState({
    camera: false,
    holistic: false,
    onnxLstm: false,
    onnxMlp: false
  });

  const addLog = (msg, type = "info") => {
    setLogs(prev => {
      const newLogs = [...prev, `[${type.toUpperCase()}] ${msg}`];
      if (newLogs.length > 10) newLogs.shift();
      return newLogs;
    });
  };

  useEffect(() => {
    let sessionLstm = null;
    let sessionMlp = null;
    let classMapLstm = {};
    let classMapMlp = {};
    let frameBuffer = [];
    let isProcessing = false;
    let cameraInstance = null;
    let holisticInstance = null;

    const initONNX = async () => {
      try {
        addLog("Baixando JSON de Classes...", "info");
        const [resLstm, resMlp] = await Promise.all([
          fetch('/class_map_lstm.json'),
          fetch('/class_map_alfabeto.json')
        ]);
        classMapLstm = await resLstm.json();
        classMapMlp = await resMlp.json();

        addLog("Carregando Modelos ONNX...", "info");
        const [sessLstm, sessMlp] = await Promise.all([
          window.ort.InferenceSession.create('/modelo_lstm_libras.onnx', { executionProviders: ['wasm'] }),
          window.ort.InferenceSession.create('/modelo_mlp_alfabeto.onnx', { executionProviders: ['wasm'] })
        ]);

        sessionLstm = sessLstm;
        sessionMlp = sessMlp;

        setStatus(s => ({ ...s, onnxLstm: true, onnxMlp: true }));
        addLog("Motores ONNX Runtime prontos!", "ok");
      } catch (e) {
        addLog("Falha ao inicializar IA: " + e.message, "error");
      }
    };

    const extractFeatures = (results) => {
      const features = new Array(258).fill(0.0);
      if (results.poseLandmarks) {
        for (let i = 0; i < 33; i++) {
          const lm = results.poseLandmarks[i];
          features[i * 4] = lm.x;
          features[(i * 4) + 1] = lm.y;
          features[(i * 4) + 2] = lm.z;
          features[(i * 4) + 3] = lm.visibility;
        }
      }
      // 2. Hands - Mapeamento exato do Python (cv_utils.py)
      // Como ativamos selfieMode: true, leftHandLandmarks contém a mão física correta espelhada!
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

      // --- 3. NORMALIZAÇÃO GEOMÉTRICA (Invariância de translação e escala) ---
      // Lógica extraída do cv_utils.py original do backend.

      const distance3D = (x1, y1, z1, x2, y2, z2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);

      // Normalizar Pose (Índices 0 a 131)
      let hasPose = false;
      for (let i = 0; i < 33; i++) { if (features[i * 4] !== 0) hasPose = true; }

      if (hasPose) {
        const shLeftX = features[11 * 4], shLeftY = features[11 * 4 + 1], shLeftZ = features[11 * 4 + 2];
        const shRightX = features[12 * 4], shRightY = features[12 * 4 + 1], shRightZ = features[12 * 4 + 2];

        const midX = (shLeftX + shRightX) / 2.0;
        const midY = (shLeftY + shRightY) / 2.0;
        const midZ = (shLeftZ + shRightZ) / 2.0;

        const shDist = distance3D(shLeftX, shLeftY, shLeftZ, shRightX, shRightY, shRightZ);
        const scale = shDist > 1e-5 ? shDist : 1.0;

        for (let i = 0; i < 33; i++) {
          features[i * 4] = (features[i * 4] - midX) / scale;
          features[i * 4 + 1] = (features[i * 4 + 1] - midY) / scale;
          features[i * 4 + 2] = (features[i * 4 + 2] - midZ) / scale;
          // visibility (i*4 + 3) não muda
        }
      }

      // Função auxiliar para normalizar Mão
      const normalizeHand = (startIdx) => {
        let hasHand = false;
        for (let i = 0; i < 21; i++) { if (features[startIdx + i * 3] !== 0) hasHand = true; }

        if (hasHand) {
          const wristX = features[startIdx], wristY = features[startIdx + 1], wristZ = features[startIdx + 2];

          const mcpX = features[startIdx + 9 * 3];
          const mcpY = features[startIdx + 9 * 3 + 1];
          const mcpZ = features[startIdx + 9 * 3 + 2];

          const handSize = distance3D(wristX, wristY, wristZ, mcpX, mcpY, mcpZ);
          const scale = handSize > 1e-5 ? handSize : 1.0;

          for (let i = 0; i < 21; i++) {
            features[startIdx + i * 3] = (features[startIdx + i * 3] - wristX) / scale;
            features[startIdx + i * 3 + 1] = (features[startIdx + i * 3 + 1] - wristY) / scale;
            features[startIdx + i * 3 + 2] = (features[startIdx + i * 3 + 2] - wristZ) / scale;
          }
        }
      };

      // Normalizar Left Hand e Right Hand
      normalizeHand(132);
      normalizeHand(195);

      return features;
    };

    const runInferenceLstm = async () => {
      if (!sessionLstm || frameBuffer.length !== 30) return;
      const flatData = Float32Array.from(frameBuffer.flat());
      try {
        const tensor = new window.ort.Tensor('float32', flatData, [1, 30, 258]);
        const results = await sessionLstm.run({ "input": tensor });
        const logits = results[Object.keys(results)[0]].data;

        const maxLogit = Math.max(...logits);
        let sumExp = 0;
        const exps = new Float32Array(logits.length);
        for (let i = 0; i < logits.length; i++) {
          const e = Math.exp(logits[i] - maxLogit);
          exps[i] = e;
          sumExp += e;
        }

        let maxProb = -1, maxIdx = -1;
        for (let i = 0; i < logits.length; i++) {
          const prob = exps[i] / sumExp;
          if (prob > maxProb) { maxProb = prob; maxIdx = i; }
        }

        setConfidence(Math.round(maxProb * 100));
        setPrediction(prev => maxProb > 0.85 ? (classMapLstm[maxIdx] || "Desconhecido") : (maxProb < 0.3 ? "--" : prev));
      } catch (e) { console.error(e); }
    };

    const runInferenceMlp = async (features) => {
      if (!sessionMlp) return;
      const flatData = Float32Array.from(features);
      try {
        const tensor = new window.ort.Tensor('float32', flatData, [1, 258]);
        const results = await sessionMlp.run({ "input": tensor }); // In Python: model(input_data)
        const logits = results[Object.keys(results)[0]].data;

        const maxLogit = Math.max(...logits);
        let sumExp = 0;
        const exps = new Float32Array(logits.length);
        for (let i = 0; i < logits.length; i++) {
          const e = Math.exp(logits[i] - maxLogit);
          exps[i] = e;
          sumExp += e;
        }

        let maxProb = -1, maxIdx = -1;
        for (let i = 0; i < logits.length; i++) {
          const prob = exps[i] / sumExp;
          if (prob > maxProb) { maxProb = prob; maxIdx = i; }
        }

        setConfidence(Math.round(maxProb * 100));
        setPrediction(maxProb > 0.50 ? classMapMlp[maxIdx] || "Desconhecido" : "Aguardando...");
      } catch (e) { console.error(e); }
    };

    const onResults = async (results) => {
      setStatus(s => ({ ...s, holistic: true }));

      const canvasCtx = canvasRef.current?.getContext('2d');
      if (canvasCtx && canvasRef.current) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (results.poseLandmarks) {
          window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS, { color: '#39FF14', lineWidth: 2 });
          window.drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF003C', lineWidth: 1, radius: 2 });
        }
        if (results.leftHandLandmarks) {
          window.drawConnectors(canvasCtx, results.leftHandLandmarks, window.HAND_CONNECTIONS, { color: '#10B981', lineWidth: 2 }); // Emerald
        }
        if (results.rightHandLandmarks) {
          window.drawConnectors(canvasCtx, results.rightHandLandmarks, window.HAND_CONNECTIONS, { color: '#10B981', lineWidth: 2 });
        }
        canvasCtx.restore();
      }

      const features = extractFeatures(results);

      const mode = activeModeRef.current;
      if (mode === 'lstm') {
        frameBuffer.push(features);
        if (frameBuffer.length > 30) frameBuffer.shift();

        if (frameBuffer.length === 30 && !isProcessing) {
          isProcessing = true;
          await runInferenceLstm();
          isProcessing = false;
        }
      } else if (mode === 'mlp') {
        frameBuffer = []; // Reset buffer
        if (!isProcessing) {
          isProcessing = true;
          await runInferenceMlp(features);
          isProcessing = false;
        }
      }
    };

    const bootstrap = async () => {
      await initONNX();

      holisticInstance = new window.Holistic({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}` });
      holisticInstance.setOptions({
        selfieMode: true,
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      holisticInstance.onResults(onResults);

      if (videoRef.current) {
        cameraInstance = new window.Camera(videoRef.current, {
          onFrame: async () => {
            setStatus(s => ({ ...s, camera: true }));
            if (videoRef.current) {
              await holisticInstance.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        cameraInstance.start();
      }
    };

    bootstrap();

    return () => {
      if (cameraInstance) cameraInstance.stop();
      if (holisticInstance) holisticInstance.close();
    };
  }, []);

  const switchMode = (mode) => {
    setActiveMode(mode);
    activeModeRef.current = mode;
    setPrediction('--');
    setConfidence(0);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white tracking-wide">TESTADOR <span className="text-emerald-500">IA</span></h1>
          <span className="bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-semibold">
            Offline Local (Navegador)
          </span>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 w-fit">
          <button
            onClick={() => switchMode('lstm')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeMode === 'lstm' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Gestos Dinâmicos (LSTM)
          </button>
          <button
            onClick={() => switchMode('mlp')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeMode === 'mlp' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Alfabeto Estático (MLP)
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center max-w-6xl mx-auto">

        {/* Video / Camera */}
        <div className="relative w-full max-w-[640px] aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 shrink-0">
          <video ref={videoRef} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1]"></video>
          <canvas ref={canvasRef} width="640" height="480" className="absolute top-0 left-0 w-full h-full object-cover"></canvas>
        </div>

        {/* Informações */}
        <div className="flex flex-col gap-6 w-full lg:w-80">

          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 transition-all hover:-translate-y-1 hover:border-slate-600">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Previsão em Tempo Real</h3>
            <div className="text-4xl font-black text-emerald-400 mb-4">{prediction}</div>

            <div className="flex justify-between text-sm text-slate-300 mb-2">
              <span>Confiança</span>
              <span className="font-bold">{confidence}%</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-200"
                style={{ width: `${confidence}%`, backgroundColor: confidence > 85 ? '#10B981' : (confidence > 50 ? '#F59E0B' : '#EF4444') }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Status do Motor</h3>
            <div className="flex items-center gap-3 mb-2 text-slate-300 text-sm">
              <div className={`w-2 h-2 rounded-full ${status.camera ? 'bg-green-500 shadow-[0_0_8px_#39FF14]' : 'bg-red-500'}`}></div>
              Câmera Ativa
            </div>
            <div className="flex items-center gap-3 mb-2 text-slate-300 text-sm">
              <div className={`w-2 h-2 rounded-full ${status.holistic ? 'bg-green-500 shadow-[0_0_8px_#39FF14]' : 'bg-red-500'}`}></div>
              MediaPipe Holistic
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-sm">
              <div className={`w-2 h-2 rounded-full ${status.onnxLstm && status.onnxMlp ? 'bg-green-500 shadow-[0_0_8px_#39FF14]' : 'bg-red-500'}`}></div>
              ONNX Runtime Web
            </div>
          </div>

          <div className="bg-black p-4 rounded-xl border border-slate-800 overflow-y-auto h-40">
            {logs.map((log, i) => (
              <div key={i} className={`text-xs font-mono mb-1 ${log.includes('[ERROR]') ? 'text-red-500' : log.includes('[OK]') ? 'text-green-500' : 'text-slate-500'}`}>
                {log}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ModelTester;
