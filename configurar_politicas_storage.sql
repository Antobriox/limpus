-- Políticas RLS para el bucket "documents" en Supabase Storage
-- Ejecuta este SQL en el SQL Editor de Supabase

-- 1. Política para permitir lectura pública (SELECT)
CREATE POLICY "Public Access for documents bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- 2. Política para permitir subida de archivos (INSERT) - usuarios autenticados
CREATE POLICY "Authenticated users can upload to documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- 3. Política para permitir actualización de archivos (UPDATE) - usuarios autenticados
CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- 4. Política para permitir eliminación de archivos (DELETE) - usuarios autenticados
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
