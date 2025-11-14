"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

export default function LogoUploadDropzone({
  onSelect,
  reset,
  initialUrl,
}: {
  onSelect: (file: File | null) => void;
  reset?: boolean;
  initialUrl?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(initialUrl || null);

  useEffect(() => {
    setPreview(initialUrl ?? null);
  }, [initialUrl]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setPreview(url);
      onSelect(file);
    },
    [onSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  useEffect(() => {
    if (reset) {
      setPreview(null);
      onSelect(null);
    }
  }, [reset, onSelect]);

  function handleRemove() {
    setPreview(null);
    onSelect(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={`
          w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition
          ${isDragActive ? "border-black bg-gray-100" : "border-gray-300 hover:border-black bg-gray-50"}
        `}
      >
        <input {...getInputProps()} />

        {preview ? (
          <img
            src={preview}
            alt="Prévia"
            className="w-28 h-28 mx-auto rounded-lg object-cover shadow-sm"
          />
        ) : (
          <div className="text-gray-600">
            <p className="font-medium">Arraste a logo aqui</p>
            <p className="text-sm text-gray-500">ou clique para selecionar</p>
          </div>
        )}
      </div>

      {preview && (
        <button
          type="button"
          onClick={handleRemove}
          className="text-sm text-red-600 hover:underline w-max mx-auto"
        >
          Remover logo
        </button>
      )}
    </div>
  );
}
