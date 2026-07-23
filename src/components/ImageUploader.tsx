import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, ZoomIn, ZoomOut, Move, Check, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  /** aspect ratio as width/height, e.g. 16/9 for landscape, 1 for square */
  aspect?: number;
  label?: string;
  folder?: string;
}

interface CropState {
  x: number;
  y: number;
  zoom: number;
}

export function ImageUploader({
  value,
  onChange,
  aspect = 16 / 9,
  label = 'Image',
  folder = 'uploads',
}: ImageUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [phase, setPhase] = useState<'idle' | 'cropping' | 'uploading'>('idle');
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localSrc, setLocalSrc] = useState<string>('');
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);

  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, zoom: 1 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; cx: number; cy: number } | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Frame dimensions rendered on screen (width always 400px in the modal)
  const FRAME_W = 400;
  const FRAME_H = Math.round(FRAME_W / aspect);

  const resetCrop = useCallback((imgW: number, imgH: number) => {
    const scaleW = FRAME_W / imgW;
    const scaleH = FRAME_H / imgH;
    const minZoom = Math.max(scaleW, scaleH);
    const scaledW = imgW * minZoom;
    const scaledH = imgH * minZoom;
    setCrop({
      x: (FRAME_W - scaledW) / 2,
      y: (FRAME_H - scaledH) / 2,
      zoom: minZoom,
    });
  }, [FRAME_W, FRAME_H]);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file', 'error');
      return;
    }
    setLocalFile(file);
    const url = URL.createObjectURL(file);
    setLocalSrc(url);

    const img = new Image();
    img.onload = () => {
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);
      resetCrop(img.naturalWidth, img.naturalHeight);
      setPhase('cropping');
    };
    img.src = url;
  }, [resetCrop, toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }, [loadFile]);

  // Drag to reposition
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, cx: crop.x, cy: crop.y };
  }, [crop]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    const scaledW = naturalW * crop.zoom;
    const scaledH = naturalH * crop.zoom;
    const minX = FRAME_W - scaledW;
    const minY = FRAME_H - scaledH;
    setCrop((prev) => ({
      ...prev,
      x: Math.min(0, Math.max(minX, dragStart.current!.cx + dx)),
      y: Math.min(0, Math.max(minY, dragStart.current!.cy + dy)),
    }));
  }, [dragging, naturalW, naturalH, FRAME_W, FRAME_H]);

  const onPointerUp = useCallback(() => {
    setDragging(false);
    dragStart.current = null;
  }, []);

  const handleZoom = (newZoom: number) => {
    const scaledW = naturalW * newZoom;
    const scaledH = naturalH * newZoom;
    const minX = FRAME_W - scaledW;
    const minY = FRAME_H - scaledH;
    // Re-center when zooming
    const cx = Math.min(0, Math.max(minX, (FRAME_W - scaledW) / 2));
    const cy = Math.min(0, Math.max(minY, (FRAME_H - scaledH) / 2));
    setCrop({ zoom: newZoom, x: cx, y: cy });
  };

  const minZoom = naturalW && naturalH
    ? Math.max(FRAME_W / naturalW, FRAME_H / naturalH)
    : 1;
  const maxZoom = minZoom * 4;

  const confirmCrop = useCallback(async () => {
    if (!localFile || !localSrc) return;
    setPhase('uploading');

    try {
      // Draw cropped image to canvas
      const canvas = document.createElement('canvas');
      // Output at 2x pixel density for crispness, capped at 2400px wide
      const outW = Math.min(FRAME_W * 2, 2400);
      const outH = Math.round(outW / aspect);
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d')!;

      const img = new Image();
      img.src = localSrc;
      await new Promise<void>((res) => { img.onload = () => res(); });

      const scaleRatio = outW / FRAME_W;
      ctx.drawImage(
        img,
        (crop.x / crop.zoom) * -1,
        (crop.y / crop.zoom) * -1,
        naturalW,
        naturalH,
        0,
        0,
        naturalW * crop.zoom * scaleRatio,
        naturalH * crop.zoom * scaleRatio,
      );

      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, 'image/jpeg', 0.92)
      );
      if (!blob) throw new Error('Could not process image');

      const ext = 'jpg';
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);
      onChange(publicUrl);
      setPhase('idle');
      setLocalSrc('');
      setLocalFile(null);
      toast('Image uploaded successfully');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
      setPhase('idle');
    }
  }, [localFile, localSrc, crop, naturalW, naturalH, FRAME_W, aspect, folder, onChange, toast]);

  const cancelCrop = () => {
    setPhase('idle');
    setLocalSrc('');
    setLocalFile(null);
    if (localSrc) URL.revokeObjectURL(localSrc);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (phase === 'cropping' || phase === 'uploading') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink-950/90 backdrop-blur-sm animate-fade-in">
        <div className="bg-ink-900 border border-ink-600 rounded-xl shadow-2xl overflow-hidden animate-scale-in w-full max-w-[460px]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-700">
            <h3 className="font-serif text-lg text-cream-50">Crop &amp; Position</h3>
            <button onClick={cancelCrop} className="text-ink-500 hover:text-cream-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Crop viewport */}
          <div className="flex justify-center py-5 px-5 bg-ink-950">
            <div
              ref={frameRef}
              className="relative overflow-hidden rounded-lg border border-gold-400/40 shadow-xl"
              style={{ width: FRAME_W, height: FRAME_H, cursor: dragging ? 'grabbing' : 'grab' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -minZoom * 0.15 : minZoom * 0.15;
                handleZoom(Math.min(maxZoom, Math.max(minZoom, crop.zoom + delta)));
              }}
            >
              {/* The actual image, positioned by crop state */}
              <img
                src={localSrc}
                alt="crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: crop.x,
                  top: crop.y,
                  width: naturalW * crop.zoom,
                  height: naturalH * crop.zoom,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />

              {/* Glass overlay — rule-of-thirds grid */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Vertical thirds */}
                <div className="absolute top-0 bottom-0 border-r border-white/10" style={{ left: '33.33%' }} />
                <div className="absolute top-0 bottom-0 border-r border-white/10" style={{ left: '66.66%' }} />
                {/* Horizontal thirds */}
                <div className="absolute left-0 right-0 border-b border-white/10" style={{ top: '33.33%' }} />
                <div className="absolute left-0 right-0 border-b border-white/10" style={{ top: '66.66%' }} />
                {/* Corner handles */}
                {[
                  'top-0 left-0 border-t-2 border-l-2',
                  'top-0 right-0 border-t-2 border-r-2',
                  'bottom-0 left-0 border-b-2 border-l-2',
                  'bottom-0 right-0 border-b-2 border-r-2',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-5 h-5 border-gold-400 ${cls}`} />
                ))}
                {/* Move hint */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="glass-dark rounded-full p-3">
                    <Move className="w-5 h-5 text-gold-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zoom slider */}
          <div className="px-5 pb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => handleZoom(Math.max(minZoom, crop.zoom - minZoom * 0.2))} className="text-ink-500 hover:text-gold-400 transition-colors">
                <ZoomOut className="w-5 h-5" />
              </button>
              <input
                type="range"
                min={minZoom}
                max={maxZoom}
                step={minZoom * 0.01}
                value={crop.zoom}
                onChange={(e) => handleZoom(parseFloat(e.target.value))}
                className="flex-1 h-1.5 appearance-none rounded-full bg-ink-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-400 [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <button onClick={() => handleZoom(Math.min(maxZoom, crop.zoom + minZoom * 0.2))} className="text-ink-500 hover:text-gold-400 transition-colors">
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-xs text-ink-500 mt-1">Drag to reposition · scroll to zoom</p>
          </div>

          {/* Wheel zoom support */}
          <div className="sr-only" aria-hidden />

          {/* Actions */}
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={confirmCrop} disabled={phase === 'uploading'} className="btn-gold flex-1">
              {phase === 'uploading' ? (
                <><span className="w-4 h-4 border-2 border-ink-950/40 border-t-ink-950 rounded-full animate-spin" /> Uploading...</>
              ) : (
                <><Check className="w-4 h-4" /> Apply &amp; Upload</>
              )}
            </button>
            <button onClick={cancelCrop} className="btn-outline">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Idle: show current image or dropzone ─────────────────────────────────
  return (
    <div className="space-y-2">
      {label && <p className="label-luxury">{label}</p>}

      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !value && fileInputRef.current?.click()}
        className={`relative rounded-lg border-2 border-dashed transition-all duration-300 overflow-hidden group ${
          value
            ? 'border-transparent cursor-default'
            : 'border-ink-600 hover:border-gold-400/60 cursor-pointer bg-ink-800/50'
        }`}
        style={{ aspectRatio: aspect }}
      >
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            {/* Edit overlay */}
            <div className="absolute inset-0 bg-ink-950/70 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-gold text-sm"
              >
                <Upload className="w-4 h-4" />
                Replace Image
              </button>
              <button
                onClick={() => onChange('')}
                className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Remove
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gold-400/10 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <p className="text-sm text-cream-200 font-medium">Drop image here or click to upload</p>
              <p className="text-xs text-ink-500 mt-1">JPG, PNG, WebP · up to 10 MB</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-gold text-sm"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
