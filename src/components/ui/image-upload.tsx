import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
  placeholder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value = '',
  onChange,
  className,
  label = 'Imagem do Evento',
  placeholder = 'Cole a URL da imagem ou faça upload'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');
  const [previewUrl, setPreviewUrl] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onChange(url);
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        onChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearImage = () => {
    setPreviewUrl('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label>{label}</Label>
        
        {/* Toggle entre URL e Upload */}
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={uploadMode === 'url' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUploadMode('url')}
            className="flex items-center gap-2"
          >
            <Link className="h-4 w-4" />
            URL
          </Button>
          <Button
            type="button"
            variant={uploadMode === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUploadMode('upload')}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>

        {/* Modo URL */}
        {uploadMode === 'url' && (
          <div className="space-y-2">
            <Input
              type="url"
              placeholder={placeholder}
              value={value}
              onChange={(e) => handleUrlChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cole a URL de uma imagem (JPG, PNG, GIF, WebP)
            </p>
          </div>
        )}

        {/* Modo Upload */}
        {uploadMode === 'upload' && (
          <div className="space-y-2">
            <Card
              className={cn(
                'border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                'hover:border-primary hover:bg-primary/5'
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Clique para selecionar ou arraste uma imagem</p>
                  <p className="text-muted-foreground">PNG, JPG, GIF até 10MB</p>
                </div>
              </div>
            </Card>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Preview da Imagem */}
      {previewUrl && (
        <Card className="p-4">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg border"
                onError={() => {
                  setPreviewUrl('');
                  onChange('');
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={clearImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Imagem selecionada</span>
              </div>
              <p className="text-xs text-muted-foreground break-all">
                {uploadMode === 'url' ? previewUrl : 'Imagem carregada do dispositivo'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};