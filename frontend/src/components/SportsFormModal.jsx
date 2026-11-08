import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2, Save } from 'lucide-react';
import { SPORTS_CATEGORIES } from '../utils/sportsCategories';
import { api } from '../services/api';

export default function SportsFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingSpace,
  initialCoordinates
}) {
  const [formData, setFormData] = useState({
    name: '',
    sport_category: 'Futebol / Society',
    custom_category: '',
    surface_type: 'Grama Sintética',
    custom_surface: '',
    is_public: true,
    is_covered: false,
    contact: '',
    opening_hours: '06:00 às 22:00',
    description: '',
    latitude: '',
    longitude: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (editingSpace) {
      const isCustomCat = !SPORTS_CATEGORIES.some(c => c.id === editingSpace.sport_category && c.id !== 'Outro');
      const standardSurfaces = ['Grama Sintética', 'Concreto', 'Areia', 'Madeira', 'Emborrachado', 'Saibro / Terra'];
      const isCustomSurf = !standardSurfaces.includes(editingSpace.surface_type);

      setFormData({
        name: editingSpace.name || '',
        sport_category: isCustomCat ? 'Outro' : editingSpace.sport_category,
        custom_category: isCustomCat ? editingSpace.sport_category : '',
        surface_type: isCustomSurf ? 'Outro' : (editingSpace.surface_type || 'Concreto'),
        custom_surface: isCustomSurf ? editingSpace.surface_type : '',
        is_public: editingSpace.is_public !== undefined ? editingSpace.is_public : true,
        is_covered: !!editingSpace.has_lighting, // Reutilizamos o campo booleano
        contact: editingSpace.opening_hours?.includes('Tel:') ? editingSpace.opening_hours.split('Tel:')[1]?.trim() : '',
        opening_hours: editingSpace.opening_hours?.includes('Tel:') ? editingSpace.opening_hours.split('|')[0]?.trim() : (editingSpace.opening_hours || 'Livre'),
        description: editingSpace.description || '',
        latitude: editingSpace.latitude || '',
        longitude: editingSpace.longitude || ''
      });
    } else {
      setFormData({
        name: '',
        sport_category: 'Futebol / Society',
        custom_category: '',
        surface_type: 'Grama Sintética',
        custom_surface: '',
        is_public: true,
        is_covered: false,
        contact: '',
        opening_hours: '06:00 às 22:00',
        description: '',
        latitude: initialCoordinates?.lat ? initialCoordinates.lat : '',
        longitude: initialCoordinates?.lng ? initialCoordinates.lng : ''
      });
    }
    setErrorMessage('');
  }, [isOpen, editingSpace, initialCoordinates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Por favor, informe o nome do espaço esportivo.');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setErrorMessage('Coordenadas não encontradas. Clique no mapa para definir o local.');
      return;
    }

    const finalCategory = formData.sport_category === 'Outro' && formData.custom_category.trim()
      ? formData.custom_category.trim()
      : formData.sport_category;

    const finalSurface = formData.surface_type === 'Outro' && formData.custom_surface.trim()
      ? formData.custom_surface.trim()
      : formData.surface_type;

    const combinedHours = formData.contact.trim()
      ? `${formData.opening_hours} | Tel: ${formData.contact.trim()}`
      : formData.opening_hours;

    const payload = {
      name: formData.name.trim(),
      sport_category: finalCategory,
      surface_type: finalSurface,
      is_public: formData.is_public,
      has_lighting: formData.is_covered, // Armazena se é coberto
      has_restrooms: false,
      opening_hours: combinedHours,
      description: formData.description.trim(),
      latitude: formData.latitude,
      longitude: formData.longitude
    };

    try {
      setIsSubmitting(true);
      if (editingSpace) {
        await api.updateSpace(editingSpace.id, payload);
      } else {
        await api.createSpace(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao salvar espaço esportivo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight text-white">
                {editingSpace ? 'Editar Espaço Esportivo' : 'Cadastrar Espaço Esportivo'}
              </h2>
              <p className="text-xs text-slate-400">Preencha as informações do local</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Nome do Espaço */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome do Espaço / Quadra *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Quadra Municipal, Arena Society, Pista de Skate..."
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Modalidade Esportiva */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Modalidade Esportiva
            </label>
            <select
              value={formData.sport_category}
              onChange={(e) => setFormData(prev => ({ ...prev, sport_category: e.target.value }))}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
            >
              {SPORTS_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>

            {/* Campo livre se for "Outro" */}
            {formData.sport_category === 'Outro' && (
              <input
                type="text"
                required
                placeholder="Digite o nome da modalidade (ex: Natação, Artes Marciais, Padel...)"
                value={formData.custom_category}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_category: e.target.value }))}
                className="mt-2 w-full text-xs px-3 py-2 rounded-lg border border-emerald-300 text-slate-900 bg-emerald-50/40 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            )}
          </div>

          {/* Tipo de Superfície / Piso */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo de Piso / Superfície
            </label>
            <select
              value={formData.surface_type}
              onChange={(e) => setFormData(prev => ({ ...prev, surface_type: e.target.value }))}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
            >
              <option value="Grama Sintética">Grama Sintética</option>
              <option value="Concreto">Concreto / Cimento</option>
              <option value="Areia">Areia</option>
              <option value="Madeira">Madeira / Taco</option>
              <option value="Emborrachado">Emborrachado / Tartan</option>
              <option value="Saibro / Terra">Saibro / Terra</option>
              <option value="Outro">Outro (especificar)</option>
            </select>

            {/* Campo livre se piso for "Outro" */}
            {formData.surface_type === 'Outro' && (
              <input
                type="text"
                required
                placeholder="Digite o tipo de piso (ex: Grama Natural, Parquet...)"
                value={formData.custom_surface}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_surface: e.target.value }))}
                className="mt-2 w-full text-xs px-3 py-2 rounded-lg border border-emerald-300 text-slate-900 bg-emerald-50/40 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            )}
          </div>

          {/* Tipo de Acesso e Ambiente */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Acesso</label>
              <select
                value={formData.is_public ? 'public' : 'private'}
                onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.value === 'public' }))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white font-medium"
              >
                <option value="public">Acesso Livre / Gratuito</option>
                <option value="private">Pago / Aluguel de Horário</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ambiente</label>
              <select
                value={formData.is_covered ? 'covered' : 'open'}
                onChange={(e) => setFormData(prev => ({ ...prev, is_covered: e.target.value === 'covered' }))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white font-medium"
              >
                <option value="open">Ao Ar Livre (Aberto)</option>
                <option value="covered">Coberto (Indoor)</option>
              </select>
            </div>
          </div>

          {/* Horário de Funcionamento e Contato */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Horário de Funcionamento</label>
              <input
                type="text"
                placeholder="Ex: 06:00 às 22:00"
                value={formData.opening_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, opening_hours: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white placeholder-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contato / Telefone (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: (83) 99999-9999"
                value={formData.contact}
                onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white placeholder-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Descrição / Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observações adicionais</label>
            <textarea
              rows={2}
              placeholder="Ex: Iluminação noturna disponível, material esportivo para empréstimo..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white placeholder-slate-400 font-medium resize-none"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  {editingSpace ? 'Salvar Alterações' : 'Cadastrar Espaço'}
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
