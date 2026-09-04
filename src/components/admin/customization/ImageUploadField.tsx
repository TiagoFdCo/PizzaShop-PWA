import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { uploadFile } from "../../../services/api";

const MAX_FILE_SIZE_MB = 2;

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  previewClassName?: string;
  helperText?: string;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  error,
  previewClassName = "aspect-square w-24",
  helperText,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite selecionar o mesmo arquivo de novo depois
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLocalError("Selecione um arquivo de imagem (PNG, JPG, SVG, WebP...)");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setLocalError(`A imagem deve ter no máximo ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setLocalError(null);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>

      <div className="flex items-start gap-3">
        <div
          className={`flex ${previewClassName} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50`}
        >
          {uploading ? (
            <Loader2 className="animate-spin text-gray-300" size={22} />
          ) : value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="text-gray-300" size={22} />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
            >
              {uploading ? "Enviando..." : "Enviar imagem"}
            </button>
            {value && !uploading && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
              >
                <X size={14} />
                Remover
              </button>
            )}
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ou cole a URL de uma imagem"
            className="input text-xs"
          />

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {helperText && !localError && !error && (
            <p className="text-xs text-gray-400">{helperText}</p>
          )}
          {(localError || error) && (
            <p className="text-xs text-red-500">{localError ?? error}</p>
          )}
        </div>
      </div>
    </div>
  );
}