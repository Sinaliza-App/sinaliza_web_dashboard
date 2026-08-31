import { useState } from 'react';
import { supabase } from '../services/supabase';
import { Send, Bell, Smartphone, History, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationCenter() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('notifications').insert([
        { title: title.trim(), message: message.trim(), created_by: user?.id }
      ]);
      
      if (error) throw error;
      
      setSuccess(true);
      setTitle('');
      setMessage('');
      
      // Reset success state after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao enviar push:', error);
      alert('Erro ao enviar notificação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto p-8 flex-1">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
            Push Notifications
          </h1>
          <p className="text-slate-400 mt-2">Engaje seus alunos. Envie avisos que aparecerão no Mural de Novidades do App.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 backdrop-blur-xl h-fit shadow-lg">
          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center space-x-2">
                <Bell className="w-4 h-4 text-neon-blue" />
                <span>Título da Notificação</span>
              </label>
              <input
                type="text"
                required
                maxLength={50}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Novo Módulo Disponível!"
                className="w-full bg-slate-900 border border-slate-700 focus:border-neon-blue rounded-xl px-4 py-3 text-white focus:outline-none transition-colors"
              />
              <div className="text-right mt-1 text-xs text-slate-500">
                {title.length}/50
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center space-x-2">
                <History className="w-4 h-4 text-neon-blue" />
                <span>Mensagem</span>
              </label>
              <textarea
                required
                rows="4"
                maxLength={200}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: Corre lá no app que acabamos de lançar as lições de Cores. Venha garantir sua ofensiva!"
                className="w-full bg-slate-900 border border-slate-700 focus:border-neon-blue rounded-xl px-4 py-3 text-white focus:outline-none transition-colors resize-none"
              />
              <div className="text-right mt-1 text-xs text-slate-500">
                {message.length}/200
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !title.trim() || !message.trim()}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : success ? (
                <>
                  <Bell className="w-5 h-5" />
                  <span>ENVIADO COM SUCESSO!</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>DISPARAR PARA TODOS OS ALUNOS</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center space-x-1">
              <Users className="w-3 h-3" />
              <span>Atingirá todos os usuários cadastrados instantaneamente.</span>
            </p>
          </form>
        </div>

        {/* Preview do Celular */}
        <div className="flex flex-col items-center justify-center relative">
          {/* Decoração */}
          <div className="absolute inset-0 bg-gradient-to-tr from-neon-blue/20 to-neon-purple/20 blur-[100px] -z-10 rounded-full"></div>
          
          <h3 className="text-slate-400 font-bold mb-6 flex items-center space-x-2">
            <Smartphone className="w-5 h-5" />
            <span>Preview no App (Mural de Novidades)</span>
          </h3>
          
          {/* Preview Visual (Cores Vibrantes) */}
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl flex flex-col overflow-hidden w-[300px] h-[580px]">
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl mx-auto w-1/2 z-10"></div>
            
            {/* Header Fake */}
            <div className="pt-12 pb-4 px-6 bg-slate-900 border-b border-slate-800">
              <h4 className="text-neon-blue font-black text-xl">NOVIDADES</h4>
            </div>
            
            {/* Feed Fake */}
            <div className="flex-1 bg-slate-950 p-4 space-y-4">
              <motion.div 
                animate={{ 
                  y: title || message ? 0 : 20,
                  opacity: title || message ? 1 : 0.5 
                }}
                className={`p-4 rounded-xl border ${title || message ? 'bg-slate-900 border-neon-blue/30 shadow-[0_0_15px_rgba(0,240,255,0.1)]' : 'bg-slate-900/50 border-slate-800'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-bold text-sm truncate pr-2">
                    {title || 'Título da Notificação'}
                  </span>
                  <span className="text-[10px] text-slate-500">Agora</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {message || 'A mensagem aparecerá aqui para o aluno ler...'}
                </p>
              </motion.div>
              
              <div className="p-4 rounded-xl border bg-slate-900 border-slate-800 opacity-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-bold text-sm">Atualização v1.0</span>
                  <span className="text-[10px] text-slate-500">Ontem</span>
                </div>
                <p className="text-slate-400 text-xs">O App Sinaliza acabou de nascer! Bem-vindo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
