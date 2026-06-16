// src/components/PortraitUpload.tsx

import { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import { uploadPortrait } from "../services/portraitService";
import { useToast } from "./Toast";

// ── Canvas helper ─────────────────────────────────────────────────────────────

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, croppedAreaPixels: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    size,
    size
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/jpeg",
      0.9
    );
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  campaignId: string;
  characterId: string;
  currentPortraitUrl?: string;
  canEdit: boolean;
  onUploaded?: (url: string) => void;
}

export function PortraitUpload({
  campaignId,
  characterId,
  currentPortraitUrl,
  canEdit,
  onUploaded,
}: Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleSave = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const url = await uploadPortrait(campaignId, characterId, blob);
      onUploaded?.(url);
      setImageSrc(null);
      toast.success("Portrait updated.");
    } catch (err) {
      console.error("Portrait upload failed:", err);
      toast.error(`Failed to upload portrait: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  }, [imageSrc, croppedAreaPixels, campaignId, characterId, onUploaded, toast]);

  const handleCancel = useCallback(() => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  return (
    <>
      {/* Portrait circle */}
      <div className="relative shrink-0 w-12 h-12">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 border border-slate-600 flex items-center justify-center">
          {currentPortraitUrl ? (
            <img src={currentPortraitUrl} alt="Portrait" className="w-full h-full object-cover" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-slate-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          )}
        </div>

        {canEdit && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-red-500 text-red-500 flex items-center justify-center hover:bg-red-500/10 transition"
            aria-label="Upload portrait"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-3 h-3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Crop modal — rendered in a portal to escape Link event bubbling */}
      {imageSrc && createPortal(
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-4 pointer-events-auto w-80 max-w-[90vw]">
              <div className="flex items-center">
                <p className="text-sm font-semibold text-slate-100 text-center flex-1">
                  Position Portrait
                </p>
                <button
                  onClick={handleCancel}
                  className="w-7 h-7 flex items-center justify-center rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 text-lg leading-none transition"
                >
                  ×
                </button>
              </div>

              {/* Cropper */}
              <div className="relative h-64 rounded-lg overflow-hidden bg-slate-800">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Zoom slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-red-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-red-500 text-red-500 font-semibold rounded text-sm hover:bg-red-500/10 transition disabled:opacity-50"
                >
                  {uploading ? "Uploading…" : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
