import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/Modal';
import { ImageUploader } from '@/components/ImageUploader';
import type { Property, PropertyStatus, PropertyType } from '@/types';

interface PropertyFormModalProps {
  property: Property | null;
  onClose: () => void;
}

export function PropertyFormModal({ property, onClose }: PropertyFormModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isEdit = !!property;

  const [title, setTitle] = useState(property?.title ?? '');
  const [description, setDescription] = useState(property?.description ?? '');
  const [price, setPrice] = useState(property?.price.toString() ?? '');
  const [status, setStatus] = useState<PropertyStatus>(property?.status ?? 'for_sale');
  const [type, setType] = useState<PropertyType>(property?.type ?? 'house');
  const [beds, setBeds] = useState(property?.beds.toString() ?? '0');
  const [baths, setBaths] = useState(property?.baths.toString() ?? '0');
  const [area, setArea] = useState(property?.area.toString() ?? '0');
  const [address, setAddress] = useState(property?.address ?? '');
  const [city, setCity] = useState(property?.city ?? '');
  const [state, setState] = useState(property?.state ?? '');
  const [zip, setZip] = useState(property?.zip ?? '');
  const [lat, setLat] = useState(property?.lat?.toString() ?? '');
  const [lng, setLng] = useState(property?.lng?.toString() ?? '');
  const [features, setFeatures] = useState(property?.features?.join(', ') ?? '');
  const [featured, setFeatured] = useState(property?.featured ?? false);
  const [imageUrls, setImageUrls] = useState<string[]>(
    property?.property_images?.length
      ? property.property_images.sort((a, b) => a.position - b.position).map((img) => img.image_url)
      : ['']
  );
  const [saving, setSaving] = useState(false);

  const handleAddImage = () => setImageUrls((prev) => [...prev, '']);
  const handleRemoveImage = (i: number) => setImageUrls((prev) => prev.filter((_, idx) => idx !== i));
  const handleImageChange = (i: number, url: string) => {
    setImageUrls((prev) => {
      const next = [...prev];
      next[i] = url;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const validImages = imageUrls.filter((url) => url.trim());

    const propertyData = {
      title,
      description,
      price: parseFloat(price) || 0,
      status,
      type,
      beds: parseInt(beds) || 0,
      baths: parseInt(baths) || 0,
      area: parseFloat(area) || 0,
      address,
      city,
      state,
      zip,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      features: features.split(',').map((f) => f.trim()).filter(Boolean),
      featured,
      agent_id: profile?.id ?? null,
    };

    try {
      let propertyId = property?.id;

      if (isEdit && property) {
        const { error } = await supabase.from('properties').update(propertyData).eq('id', property.id);
        if (error) throw error;
        await supabase.from('property_images').delete().eq('property_id', property.id);
        if (validImages.length > 0) {
          await supabase.from('property_images').insert(
            validImages.map((url, i) => ({ property_id: property.id, image_url: url, position: i }))
          );
        }
        toast('Property updated successfully');
      } else {
        const { data, error } = await supabase.from('properties').insert(propertyData).select().single();
        if (error) throw error;
        propertyId = data.id;
        if (validImages.length > 0) {
          await supabase.from('property_images').insert(
            validImages.map((url, i) => ({ property_id: propertyId, image_url: url, position: i }))
          );
        }
        toast('Property added successfully');
      }
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save property', 'error');
    }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Property' : 'Add New Property'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label-luxury">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-luxury" required />
        </div>

        <div>
          <label className="label-luxury">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input-luxury resize-none" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="label-luxury">Price ($)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input-luxury" required />
          </div>
          <div>
            <label className="label-luxury">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as PropertyStatus)} className="input-luxury">
              <option value="for_sale">For Sale</option>
              <option value="for_rent">For Rent</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          <div>
            <label className="label-luxury">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as PropertyType)} className="input-luxury">
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="land">Land</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
          <div>
            <label className="label-luxury">Bedrooms</label>
            <input type="number" value={beds} onChange={(e) => setBeds(e.target.value)} className="input-luxury" />
          </div>
          <div>
            <label className="label-luxury">Bathrooms</label>
            <input type="number" value={baths} onChange={(e) => setBaths(e.target.value)} className="input-luxury" />
          </div>
          <div>
            <label className="label-luxury">Area (sqft)</label>
            <input type="number" value={area} onChange={(e) => setArea(e.target.value)} className="input-luxury" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-luxury">Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="input-luxury" />
          </div>
          <div>
            <label className="label-luxury">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="input-luxury" />
          </div>
          <div>
            <label className="label-luxury">State</label>
            <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="input-luxury" />
          </div>
          <div>
            <label className="label-luxury">ZIP</label>
            <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} className="input-luxury" />
          </div>
          <div>
            <label className="label-luxury">Latitude</label>
            <input type="text" value={lat} onChange={(e) => setLat(e.target.value)} className="input-luxury" placeholder="34.0522" />
          </div>
          <div>
            <label className="label-luxury">Longitude</label>
            <input type="text" value={lng} onChange={(e) => setLng(e.target.value)} className="input-luxury" placeholder="-118.2437" />
          </div>
        </div>

        <div>
          <label className="label-luxury">Features (comma-separated)</label>
          <input type="text" value={features} onChange={(e) => setFeatures(e.target.value)} className="input-luxury" placeholder="Pool, Garage, Smart Home" />
        </div>

        {/* Property images with uploader */}
        <div>
          <label className="label-luxury">Property Photos</label>
          <div className="space-y-4">
            {imageUrls.map((url, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1">
                  <ImageUploader
                    value={url}
                    onChange={(newUrl) => handleImageChange(i, newUrl)}
                    aspect={16 / 9}
                    folder="properties"
                  />
                </div>
                {imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="mt-2 w-9 h-9 rounded-full hover:bg-red-500/10 text-red-400 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddImage}
              className="btn-ghost text-sm text-gold-400"
            >
              <Plus className="w-4 h-4" />
              Add another photo
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-5 h-5 accent-gold-400"
            />
            <span className="text-sm text-cream-200">Featured property (shows on homepage)</span>
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-ink-700">
          <button type="submit" disabled={saving} className="btn-gold flex-1">
            {saving ? 'Saving...' : isEdit ? 'Update Property' : 'Add Property'}
          </button>
          <button type="button" onClick={onClose} className="btn-outline">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
