import { useState } from 'react';
import { Bed, Bath, Maximize, MapPin, Heart, Pencil, Trash2 } from 'lucide-react';
import type { Property } from '@/types';
import { formatPrice, statusLabel, typeLabel } from '@/lib/format';
import { useHashRoute } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

interface PropertyCardProps {
  property: Property;
  onEdit?: (property: Property) => void;
  onDelete?: (id: string) => void;
  favoriteIds?: Set<string>;
  onFavoriteToggle?: (id: string) => void;
}

export function PropertyCard({ property, onEdit, onDelete, favoriteIds, onFavoriteToggle }: PropertyCardProps) {
  const { navigate } = useHashRoute();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [toggling, setToggling] = useState(false);

  const isStaff = profile?.role === 'agent' || profile?.role === 'admin';
  const isFavorited = favoriteIds?.has(property.id) ?? false;
  const imageUrl = property.property_images?.[0]?.image_url ?? 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800';

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast('Please sign in to save favorites', 'info');
      navigate('/login');
      return;
    }
    setToggling(true);
    if (isFavorited) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', property.id);
      if (!error) {
        onFavoriteToggle?.(property.id);
        toast('Removed from favorites');
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, property_id: property.id });
      if (!error) {
        onFavoriteToggle?.(property.id);
        toast('Added to favorites!');
      }
    }
    setToggling(false);
  };

  return (
    <div
      className="card-luxury group cursor-pointer relative"
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden" onClick={() => navigate(`/properties/${property.id}`)}>
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 text-xs font-medium tracking-wide rounded-sm ${
            property.status === 'sold'
              ? 'bg-red-500/90 text-white'
              : property.status === 'for_rent'
              ? 'bg-blue-500/90 text-white'
              : 'bg-gold-400 text-ink-950'
          }`}>
            {statusLabel(property.status)}
          </span>
        </div>

        {/* Type badge */}
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 text-xs font-medium tracking-wide rounded-sm glass text-cream-100">
            {typeLabel(property.type)}
          </span>
        </div>

        {/* Favorite button — only for regular clients, not staff */}
        {user && !isStaff && (
          <button
            onClick={handleFavorite}
            disabled={toggling}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full glass-dark flex items-center justify-center transition-all duration-300 hover:scale-110"
          >
            <Heart className={`w-5 h-5 transition-colors ${isFavorited ? 'fill-gold-400 text-gold-400' : 'text-cream-100'}`} />
          </button>
        )}

        {/* Price */}
        <div className="absolute bottom-4 left-4">
          <p className="text-2xl font-serif font-semibold text-cream-50">
            {formatPrice(property.price, property.status)}
          </p>
        </div>

        {/* Featured star */}
        {property.featured && (
          <div className="absolute bottom-14 right-4">
            <span className="px-2 py-1 text-xs bg-gold-400/20 text-gold-300 rounded-sm border border-gold-400/30">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5" onClick={() => navigate(`/properties/${property.id}`)}>
        <h3 className="font-serif text-xl font-medium text-cream-50 mb-2 group-hover:text-gold-300 transition-colors">
          {property.title}
        </h3>
        <div className="flex items-center gap-1 text-ink-500 text-sm mb-4">
          <MapPin className="w-4 h-4 text-gold-400" />
          <span>{property.address}, {property.city}, {property.state}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 text-cream-200 text-sm border-t border-ink-700 pt-4">
          <div className="flex items-center gap-1.5">
            <Bed className="w-4 h-4 text-gold-400" />
            <span>{property.beds} Beds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4 text-gold-400" />
            <span>{property.baths} Baths</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize className="w-4 h-4 text-gold-400" />
            <span>{property.area.toLocaleString()} sqft</span>
          </div>
        </div>
      </div>

      {/* Admin edit/delete buttons */}
      {isStaff && onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(property); }}
          className="absolute top-16 right-4 w-9 h-9 rounded-full glass-dark flex items-center justify-center text-gold-400 hover:bg-gold-400 hover:text-ink-950 transition-all duration-300 opacity-0 group-hover:opacity-100"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
      {isStaff && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this property? This cannot be undone.')) {
              onDelete(property.id);
            }
          }}
          className="absolute top-28 right-4 w-9 h-9 rounded-full glass-dark flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
