'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { File, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploads {
  identity: { file: File | null; progress: number; url: string; error: string | null };
  license: { file: File | null; progress: number; url: string; error: string | null };
}

interface Step4_DocumentsProps {
  fileUploads: FileUploads;
  setFileUploads: React.Dispatch<React.SetStateAction<FileUploads>>;
}

const FileUploader = ({ type, title, fileState, setFileUploads }: {
  type: 'identity' | 'license';
  title: string;
  fileState: FileUploads[typeof type];
  setFileUploads: React.Dispatch<React.SetStateAction<FileUploads>>;
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFileUploads(prev => ({
        ...prev,
        [type]: { file: acceptedFiles[0], progress: 0, url: '', error: null }
      }));
    }
  }, [setFileUploads, type]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div>
      <p className="font-medium text-sm mb-2">{title}</p>
      {fileState.file ? (
        <div className="p-3 border rounded-lg bg-card flex items-center space-x-3">
          <File className="h-6 w-6 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium truncate">{fileState.file.name}</p>
            {fileState.progress > 0 && fileState.progress < 100 && (
                <Progress value={fileState.progress} className="h-1 mt-1" />
            )}
            {fileState.progress === 100 && !fileState.error && (
                <div className="flex items-center text-xs text-green-500 mt-1">
                    <CheckCircle className="w-3 h-3 mr-1" /> Completo
                </div>
            )}
            {fileState.error && (
                <div className="flex items-center text-xs text-destructive mt-1">
                    <AlertCircle className="w-3 h-3 mr-1" /> {fileState.error}
                </div>
            )}
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? 'Suelta el archivo aquí...' : 'Arrastra y suelta o haz clic para seleccionar'}
          </p>
          <p className="text-xs text-muted-foreground">PDF o Imagen (máx 5MB)</p>
        </div>
      )}
    </div>
  );
};

export default function Step4_Documents({ fileUploads, setFileUploads }: Step4_DocumentsProps) {
  return (
    <div className="space-y-6">
      <FileUploader type="identity" title="Documento de Identidad (Cédula o Pasaporte)" fileState={fileUploads.identity} setFileUploads={setFileUploads} />
      <FileUploader type="license" title="Licencia Profesional o Diploma" fileState={fileUploads.license} setFileUploads={setFileUploads} />
    </div>
  );
}
