import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Loader2, Save, Sparkles } from 'lucide-react';
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
    surface_type: 'Grama Sintética',
    is_public: true,
    has_lighting: false,
    has_restrooms: false,
    opening_hours: 'Livre',
    description: '',
    latitude: '',
    longitude: ''
  });

  // Estado para busca por geocodificação (Nominatim)
  const [addressQuery, setAddressQuery] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Preencher formulário ao abrir (para criação ou edição)
  useEffect(() => {
    if (!isOpen) return;

    if (editingSpace) {
      setFormData({
        name: editingSpace.name || '',
        sport_category: editingSpace.sport_category || 'Futebol / Society',
        surface_type: editingSpace.surface_type || 'Concreto',
        is_public: editingSpace.is_public !== undefined ? editingSpace.is_public : true,
        has_lighting: !!editingSpace.has_lighting,
        has_restrooms: !!editingSpace.has_restrooms,
        opening_hours: editingSpace.opening_hours || 'Livre',
        description: editingSpace.description || '',
        latitude: editingSpace.latitude || '',
        longitude: editingSpace.longitude || ''
      });
      setAddressQuery('');
      setAddressSuggestions([]);
    } else {
      setFormData({
        name: '',
        sport_category: 'Futebol / Society',
        surface_type: 'Grama Sintética',
        is_public: true,
        has_lighting: false,
        has_restrooms: false,
        opening_hours: '06:00 às 22:00',
        description: '',
        latitude: initialCoordinates?.lat ? initialCoordinates.lat.toFixed(6) : '',
        longitude: initialCoordinates?.lng ? initialCoordinates.lng.toFixed(6) : ''
      });
      setAddressQuery('');
      setAddressSuggestions([]);
    }
    setErrorMessage('');
  }, [isOpen, editingSpace, initialCoordinates]);

  // Busca de endereços no Nominatim com debounce
  useEffect(() => {
    if (!addressQuery || addressQuery.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingAddress(true);
        const results = await api.searchAddressNominatim(addressQuery);
        setAddressSuggestions(results || []);
      } catch (err) {
        console.error('Erro na geocodificação:', err);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [addressQuery]);

  // Ao selecionar um resultado da geocodificação
  const handleSelectAddress = (item) => {
    setFormData(prev => ({
      ...prev,
      name: prev.name || item.name || item.display_name.split(',')[0],
      latitude: parseFloat(item.lat).toFixed(6),
      longitude: parseFloat(item.lon).toFixed(6)
    }));
    setAddressQuery(item.display_name);
    setAddressSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Por favor, informe o nome do espaço esportivo.');
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      setErrorMessage('Defina a localização espacial (use a busca por endereço ou clique no mapa).');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingSpace) {
        await api.updateSpace(editingSpace.id, formData);
      } else {
        await api.createSpace(formData);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho do Modal */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">
                {editingSpace ? 'Editar Espaço Esportivo' : 'Cadastrar Novo Espaço Esportivo'}
              </h2>
              <p className="text-xs text-slate-400">
                PostGIS • SRID 4326 (WGS 84)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Campo de Geocodificação (Nominatim / OpenStreetMap) */}
          {/* Atende ao requisito: "A tela de cadastro deve permitir a busca por localidades utilizando o serviço de geocodificação" */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Buscar Endereço / Localidade (Geocodificação)</span>
              <span className="text-[10px] text-emerald-600 font-normal">Nominatim OSM</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Parque Ibirapuera, Rua Augusta, Praça..."
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-8 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              {isSearchingAddress && (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-2.5 top-2.5" />
              )}
            </div>

            {/* Lista suspensa de resultados do Nominatim */}
            {addressSuggestions.length > 0 && (
              <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                {addressSuggestions.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelectAddress(item)}
                    className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs text-slate-700 flex items-start gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{item.display_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Coordenadas Geográficas (Latitude e Longitude) */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Latitude (Y)</label>
              <input
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                placeholder="-23.550520"
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Longitude (X)</label>
              <input
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                placeholder="-46.633308"
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
              />
            </div>
            <p className="col-span-2 text-[10px] text-slate-500 italic">
              💡 Você também pode clicar diretamente em qualquer ponto do mapa para preencher estas coordenadas.
            </p>
          </div>

          {/* Nome do Espaço */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Espaço / Quadra *</label>
            <input
              type="text"
              required
              placeholder="Ex: Centro Esportivo Municipal, Quadra do Parque..."
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Categoria e Piso */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Modalidade Esportiva</label>
              <select
                value={formData.sport_category}
                onChange={(e) => setFormData(prev => ({ ...prev, sport_category: e.target.value }))}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {SPORTS_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Superfície / Piso</label>
              <select
                value={formData.surface_type}
                onChange={(e) => setFormData(prev => ({ ...prev, surface_type: e.target.value }))}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Grama Sintética">Grama Sintética</option>
                <option value="Concreto">Concreto / Cimento</option>
                <option value="Areia">Areia</option>
                <option value="Madeira">Madeira / Taco</option>
                <option value="Emborrachado">Emborrachado / Tartan</option>
                <option value="Terra / Saibro">Saibro / Terra</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Checkboxes de Infraestrutura */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 text-xs">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-[11px] font-medium text-slate-700">Público / Gratuito</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 text-xs">
              <input
                type="checkbox"
                checked={formData.has_lighting}
                onChange={(e) => setFormData(prev => ({ ...prev, has_lighting: e.target.checked }))}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <span className="text-[11px] font-medium text-slate-700">💡 Iluminação</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 text-xs">
              <input
                type="checkbox"
                checked={formData.has_restrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, has_restrooms: e.target.checked }))}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] font-medium text-slate-700">🚿 Vestiários</span>
            </label>
          </div>

          {/* Horário de Funcionamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Horário de Funcionamento</label>
            <input
              type="text"
              placeholder="Ex: 06:00 às 22:00, 24 horas, Seg a Sex..."
              value={formData.opening_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, opening_hours: e.target.value }))}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Descrição Opcional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição / Regras de Uso</label>
            <textarea
              rows={2}
              placeholder="Ex: Necessário agendamento prévio com a associação, bolas disponíveis para empréstimo..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Botões do Rodapé */}
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
              className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Salvando no PostGIS...
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
