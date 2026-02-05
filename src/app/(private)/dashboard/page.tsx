"use client";

import { useAuth } from "@/components/AuthContext";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";

export default function DashboardPage() {
  const { user, n8nCode } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<unknown[][]>([]);
  const [validFile, setValidFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function resetPreview() {
    setPreviewHeaders([]);
    setPreviewRows([]);
    setValidFile(false);
    setParseError(null);
    setValidationErrors([]);
  }

  function validateExcelFile(fileName: string, sheetName: string, headers: string[]): string[] {
    const errors: string[] = [];
    
    // Validar nombre del archivo
    if (fileName !== "INS_PRESUPUESTO.xlsx") {
      errors.push("El archivo debe llamarse exactamente 'INS_PRESUPUESTO.xlsx'");
    }
    
    // Validar nombre de la hoja
    if (sheetName !== "PRESUPUESTO") {
      errors.push("La hoja debe llamarse exactamente 'PRESUPUESTO'");
    }
    
    // Columnas obligatorias
    const requiredColumns = [
      "Anno", "Mes_Desde", "Mes_Hasta", "Version", "Programa", "SubPrograma",
      "ElementoPEP", "Descripcion", "Partida", "Desc_Subpartida", "Presup_Orig",
      "Presup_Mod", "Ejecutado", "Disponible", "Sueldos", "Cargas", "Dif_Camb", "Sumas_sin_Asig"
    ];
    
    // Verificar que todas las columnas obligatorias estén presentes
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      errors.push(`Faltan las siguientes columnas obligatorias: ${missingColumns.join(", ")}`);
    }
    
    return errors;
  }

  async function handleFileSelected(file: File | null) {
    // Limpiar estados previos inmediatamente
    resetPreview();
    
    if (!file) {
      setSelectedName(null);
      return;
    }
    
    setSelectedName(file.name);
    const isXlsx = /\.xlsx$/i.test(file.name);
    if (!isXlsx) {
      alert("Solo se permiten archivos .xlsx");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedName(null);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      
      // Buscar la hoja "PRESUPUESTO" específicamente
      const sheetName = "PRESUPUESTO";
      if (!workbook.SheetNames.includes(sheetName)) {
        setValidationErrors(["La hoja debe llamarse exactamente 'PRESUPUESTO'"]);
        setValidFile(false);
        return;
      }
      
      const ws = workbook.Sheets[sheetName];
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
      if (!rows || rows.length === 0) {
        setValidationErrors(["La hoja 'PRESUPUESTO' está vacía"]);
        setValidFile(false);
        return;
      }
      
      const headers = (rows[0] as unknown[]).map((h) => String(h ?? ""));
      const dataRows = rows.slice(1);
      
      // Validar el archivo completo
      const errors = validateExcelFile(file.name, sheetName, headers);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setValidFile(false);
        return;
      }
      
      // Si llegamos aquí, el archivo es válido
      setPreviewHeaders(headers);
      setPreviewRows(dataRows);
      setValidFile(true);
      setValidationErrors([]);
      setParseError(null);
    } catch (e) {
      setParseError("No se pudo leer el archivo .xlsx");
      setValidationErrors([]);
      setValidFile(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) {
      alert("Debe seleccionar un archivo Excel");
      return;
    }
    const extOk = /\.xlsx$/i.test(file.name);
    if (!extOk) {
      alert("Solo se permiten archivos .xlsx");
      return;
    }
    if (!validFile) {
      alert("Espere a que se genere la vista previa");
      return;
    }
    if (!n8nCode) {
      alert("No hay Código N8N asociado al usuario");
      return;
    }
    const fd = new FormData();
    // Enviar el archivo bajo la clave "data" (como Postman) y pasar n8nCode al backend
    fd.set("data", file);
    fd.set("n8nCode", n8nCode);
    try {
      setSubmitting(true);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        alert(data?.error || "Error enviando al webhook");
        return;
      }
      alert("Archivo enviado a n8n correctamente");
      form.reset();
      setSelectedName(null);
    } catch {
      alert("No se pudo enviar el archivo");
    } finally {
      setSubmitting(false);
    }
  }
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    handleFileSelected(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    
    // Limpiar el input file antes de asignar el nuevo archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
    }
    
    handleFileSelected(file);
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-7xl space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Cargador de Excel
          </h1>
          <p className="text-white/60">
            Sube tu archivo Excel y visualiza los datos antes de enviarlos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
        <input
          ref={fileInputRef}
          id="file"
          type="file"
          name="file"
          onChange={handleInputChange}
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
        />

          {/* Card 1: Upload Area */}
          <div className="bg-neutral-800/80 backdrop-blur-2xl rounded-lg shadow-lg p-8 w-full max-w-2xl mx-auto">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#0A84FF]/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#0A84FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Seleccionar Archivo
              </h2>
            </div>

        <label
          htmlFor="file"
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={[
                "block w-full rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200",
                "text-white/80",
                "border-white/30 hover:border-white/60",
                "hover:bg-white/5",
                dragActive ? "border-[#0A84FF] bg-[#0A84FF]/10 scale-105" : "",
          ].join(" ")}
        >
              <div className="text-lg font-medium">Arrastra tu archivo Excel aquí</div>
              <div className="mt-2 text-sm opacity-70">o haz clic para seleccionarlo</div>
              <div className="mt-4 text-xs text-white/50">
                Solo archivos INS_PRESUPUESTO.xlsx
              </div>
            </label>

          {selectedName && (
              <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-white">{selectedName}</div>
                    <div className="text-sm text-green-400">Archivo seleccionado correctamente</div>
                  </div>
                </div>
              </div>
            )}

            {parseError && (
              <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="text-red-300">{parseError}</div>
                </div>
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-red-300 font-medium mb-2">Validación fallida:</div>
                    <ul className="text-red-300/80 text-sm space-y-1">
                      {validationErrors.map((error, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Preview Area */}
          {validFile && previewHeaders.length > 0 && (
            <div className="bg-neutral-800/80 backdrop-blur-2xl rounded-lg shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#0A84FF]/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#0A84FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Vista Previa
                  </h2>
                  <p className="text-sm text-white/60">
                    Mostrando {Math.min(previewRows.length, 10)} filas de datos del archivo Excel
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-white/20">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-700/50 sticky top-0">
                      <tr>
                        {previewHeaders.map((h, idx) => (
                          <th key={idx} className="px-4 py-3 text-left font-semibold text-white border-b border-white/20 whitespace-nowrap">
                            {h || "Columna " + (idx + 1)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {previewRows.slice(0, Math.max(10, previewRows.length)).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                          {previewHeaders.map((_, cIdx) => (
                            <td key={cIdx} className="px-4 py-3 text-white/80 whitespace-nowrap">
                              {String(row?.[cIdx] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {/* Si hay menos de 10 filas, agregar filas vacías para completar */}
                      {previewRows.length < 10 && Array.from({ length: 10 - previewRows.length }).map((_, emptyIdx) => (
                        <tr key={`empty-${emptyIdx}`} className="hover:bg-white/5 transition-colors">
                          {previewHeaders.map((_, cIdx) => (
                            <td key={cIdx} className="px-4 py-3 text-white/40 whitespace-nowrap italic">
                              (vacío)
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Submit Button */}
          <div className="flex justify-center">
        <button
          type="submit"
              disabled={submitting || !validFile}
              className={[
                "px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200",
                "bg-[#0A84FF] hover:brightness-110",
                "shadow-lg hover:shadow-xl",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center gap-3"
              ].join(" ")}
            >
              {submitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar Archivo
                </>
              )}
        </button>
          </div>
      </form>
      </div>
    </div>
  );
}


