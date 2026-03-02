import { supabase } from './supabase';

export interface AnnotationState {
  textBoxes: TextBox[];
  images: AnnotationImage[];
  drawings: DrawingPath[];
}

export interface TextBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
  page: number;
}

export interface AnnotationImage {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  page: number;
}

export interface DrawingPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  page: number;
}

export interface PdfAnnotation {
  id: string;
  username: string;
  pdf_filename: string;
  annotated_pdf_data: string | null;
  annotation_state: AnnotationState;
  created_at: string;
  updated_at: string;
}

export async function loadPdfAnnotation(
  username: string,
  pdfFilename: string
): Promise<PdfAnnotation | null> {
  const { data, error } = await supabase
    .from('pdf_annotations')
    .select('*')
    .eq('username', username)
    .eq('pdf_filename', pdfFilename)
    .maybeSingle();

  if (error || !data) return null;
  return data as PdfAnnotation;
}

export async function loadAllAnnotationsForPdf(
  pdfFilename: string
): Promise<PdfAnnotation[]> {
  const { data, error } = await supabase
    .from('pdf_annotations')
    .select('*')
    .eq('pdf_filename', pdfFilename)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data as PdfAnnotation[];
}

export async function savePdfAnnotation(
  username: string,
  pdfFilename: string,
  annotationState: AnnotationState,
  annotatedPdfData?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('pdf_annotations')
    .upsert(
      {
        username,
        pdf_filename: pdfFilename,
        annotation_state: annotationState,
        annotated_pdf_data: annotatedPdfData ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'username,pdf_filename' }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deletePdfAnnotationsForUser(username: string): Promise<void> {
  await supabase.from('pdf_annotations').delete().eq('username', username);
}
