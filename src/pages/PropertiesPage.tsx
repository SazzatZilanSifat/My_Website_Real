import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Plus, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Property, PropertyStatus, PropertyType } from '@/types';
import { PropertyCard } from '@/components/PropertyCard';
import { Reveal } from '@/components/Reveal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PropertyFormModal } from '@/components/PropertyFormModal';

export function PropertiesPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isStaff = profile?.role === 'agent' || profile?.role === 'admin';

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minBeds, setMinBeds] = useState<string>('0');
  const [showFilters, setShowFilters] = useState(false);

  // Edit modal
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('properties').select('*, property_images(*)');

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (typeFilter !== 'all') query = query.eq('type', typeFilter);
    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
    if (minBeds !== '0') query = query.gte('beds', parseInt(minBeds));

    const { data } = await query.order('created_at', { ascending: false });
    let filtered = (data as Property[]) || [];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      );
    }

    setProperties(filtered);
    setLoading(false);
  }, [statusFilter, typeFilter, minPrice, maxPrice, minBeds, search]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (user) {
      supabase.from('favorites').select('property_id').eq('user_id', user.id).then(({ data }) => {
        if (data) setFavoriteIds(new Set(data.map((d) => d.property_id)));
      });
    }
  }, [user]);

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) {
      toast('Failed to delete property', 'error');
    } else {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      toast('Property deleted');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProperty(null);
    fetchProperties();
  };

  return (
    <div className="min-h-screen bg-ink-950 pt-24">
      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Reveal>
          <p className="section-subtitle">Browse Our Collection</p>
          <h1 className="section-title mb-4">All Properties</h1>
          <div className="gold-divider" />
        </Reveal>
      </div>

      {/* Search bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city, address, or title..."
              className="input-luxury pl-12"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          {isStaff && (
            <button
              onClick={() => { setEditingProperty(null); setShowForm(true); }}
              className="btn-gold whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-4 glass-dark border border-ink-700 rounded-lg p-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label-luxury">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-luxury">
                  <option value="all">All Status</option>
                  <option value="for_sale">For Sale</option>
                  <option value="for_rent">For Rent</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
              <div>
                <label className="label-luxury">Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-luxury">
                  <option value="all">All Types</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="label-luxury">Min Price</label>
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="$0" className="input-luxury" />
              </div>
              <div>
                <label className="label-luxury">Max Price</label>
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="No limit" className="input-luxury" />
              </div>
              <div>
                <label className="label-luxury">Min Bedrooms</label>
                <select value={minBeds} onChange={(e) => setMinBeds(e.target.value)} className="input-luxury">
                  <option value="0">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setMinPrice('');
                  setMaxPrice('');
                  setMinBeds('0');
                  setSearch('');
                }}
                className="btn-ghost text-sm"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <p className="text-sm text-ink-500">
          {loading ? 'Loading...' : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} found`}
        </p>
      </div>

      {/* Property grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-luxury h-96 animate-pulse">
                <div className="h-64 bg-ink-800" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-ink-800 rounded w-3/4" />
                  <div className="h-4 bg-ink-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <Home className="w-16 h-16 text-ink-600 mx-auto mb-4" />
            <p className="text-cream-200 text-lg mb-2">No properties found</p>
            <p className="text-ink-500 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property, i) => (
              <Reveal key={property.id} delay={(i % 3) * 100}>
                <PropertyCard
                  property={property}
                  favoriteIds={favoriteIds}
                  onFavoriteToggle={toggleFavorite}
                  onEdit={isStaff ? (p) => { setEditingProperty(p); setShowForm(true); } : undefined}
                  onDelete={isStaff ? handleDelete : undefined}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {/* Property form modal */}
      {showForm && (
        <PropertyFormModal
          property={editingProperty}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
