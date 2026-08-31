import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Library, Image as ImageIcon, Plus, Edit2, Trash2, X, Check, Search, Save, EyeOff, AlertTriangle } from 'lucide-react';

export default function ContentManager() {
  const [activeTab, setActiveTab] = useState('lessons'); // UI state
  const [displayedTab, setDisplayedTab] = useState('lessons'); // Data state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tabToFetch) => {
    setLoading(true);
    try {
      let table = 'lessons';
      if (tabToFetch === 'modules') table = 'modules';
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('id', { ascending: false });
        
      if (error) throw error;
      setItems(data || []);
      setDisplayedTab(tabToFetch);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTableName = () => {
    if (activeTab === 'modules') return 'modules';
    return 'lessons';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir?')) return;
    
    try {
      const { error } = await supabase.from(getTableName()).delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Erro ao excluir item.');
    }
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        is_draft: true // Default to draft for new content
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const table = getTableName();
      
      // Remove read-only fields that Supabase won't accept on insert/update
      const { id, created_at, ...cleanData } = formData;
      
      if (editingItem) {
        const { error } = await supabase.from(table).update(cleanData).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert([cleanData]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      let errorMsg = error.message || '';
      if (errorMsg.includes('duplicate key value violates unique constraint')) {
        errorMsg = 'O identificador desse item já existe no banco. Isso geralmente é um problema interno de sincronia (ID duplicado). Peça ao suporte para rodar o script de correção do banco.';
      }
      alert('⚠️ Ops! Ocorreu um erro ao tentar salvar:\n\n' + errorMsg);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100 font-sans p-8 flex-1">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-blue">
            Gestão de Conteúdo
          </h1>
          <p className="text-slate-400 mt-2">Adicione e organize Módulos, Lições e o Dicionário.</p>
          <div className="mt-4 inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-2 rounded-xl text-sm font-medium">
             <AlertTriangle className="w-4 h-4" />
             <span>Itens marcados como <strong>RASCUNHO</strong> não aparecem no App para os alunos, apenas para administradores.</span>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green hover:text-black px-4 py-2 rounded-xl transition-all duration-300 font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>NOVO ITEM</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50 backdrop-blur-xl">
        {[
          { id: 'lessons', label: 'Lições', icon: BookOpen },
          { id: 'modules', label: 'Módulos', icon: Library },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-neon-blue text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {/* List */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg relative min-h-[400px]">
        {items.length === 0 && !loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Nenhum item encontrado.</div>
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-300 ${loading ? 'opacity-30' : 'opacity-100'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={displayedTab}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full"
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-700/50">
                      <th className="p-4 text-slate-400 font-semibold text-sm">ID</th>
                      <th className="p-4 text-slate-400 font-semibold text-sm">TÍTULO</th>
                      <th className="p-4 text-slate-400 font-semibold text-sm">STATUS</th>
                      <th className="p-4 text-slate-400 font-semibold text-sm text-right">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <motion.tr
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 24 }}
                        key={`${displayedTab}-${item.id}`}
                        className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="p-4 text-slate-500">#{item.id}</td>
                        <td className="p-4 font-bold text-white">{item.title}</td>
                        <td className="p-4">
                          {item.is_draft ? (
                            <span className="inline-flex items-center space-x-1 bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">
                              <EyeOff className="w-3 h-3" />
                              <span>RASCUNHO</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 bg-neon-green/20 text-neon-green px-3 py-1 rounded-full text-xs font-bold border border-neon-green/30">
                              <Check className="w-3 h-3" />
                              <span>PÚBLICO</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => openModal(item)}
                              className="p-2 bg-slate-700/50 hover:bg-neon-blue hover:text-black text-slate-300 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 bg-slate-700/50 hover:bg-neon-red hover:text-white text-slate-300 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl p-6 w-full max-w-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingItem ? 'Editar Item' : 'Criar Novo Item'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-blue"
                    placeholder="Ex: Alfabeto em Libras"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
                  <textarea
                    rows="3"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-blue"
                    placeholder="Descrição do conteúdo..."
                  />
                </div>
                
                {(activeTab === 'lessons' || activeTab === 'dictionary') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">URL da Mídia (GIF/Imagem/Vídeo)</label>
                    <input
                      type="text"
                      value={formData.gif_url || formData.example_image_url || ''}
                      onChange={(e) => setFormData({ ...formData, gif_url: e.target.value, example_image_url: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-blue"
                      placeholder="https://..."
                    />
                  </div>
                )}
                
                {activeTab === 'lessons' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">ID do Módulo</label>
                    <input
                      type="number"
                      value={formData.module_id || ''}
                      onChange={(e) => setFormData({ ...formData, module_id: parseInt(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-blue"
                    />
                  </div>
                )}
                
                {activeTab === 'dictionary' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Gesture ID (Modelo AI)</label>
                    <input
                      type="text"
                      value={formData.gesture_id || ''}
                      onChange={(e) => setFormData({ ...formData, gesture_id: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-blue"
                    />
                  </div>
                )}

                {/* Draft Toggle */}
                <div className="flex items-center space-x-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mt-4">
                  <div 
                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${formData.is_draft ? 'bg-amber-500' : 'bg-slate-600'}`}
                    onClick={() => setFormData({ ...formData, is_draft: !formData.is_draft })}
                  >
                    <motion.div 
                      layout
                      className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full"
                      animate={{ x: formData.is_draft ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                  <div>
                    <p className="text-white font-bold">Salvar como Rascunho</p>
                    <p className="text-xs text-slate-400">Rascunhos só são visíveis para Administradores (Professores).</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 bg-neon-green hover:bg-green-400 text-black px-6 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(0,255,170,0.4)] transition-all"
                  >
                    <Save className="w-5 h-5" />
                    <span>SALVAR</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
