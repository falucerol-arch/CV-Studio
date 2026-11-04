# Registro de fuentes y licencias de plantillas

| Plantilla / componente | Fuente | Licencia revisada | Uso en CV Studio |
|---|---|---|---|
| Profesional, Moderno, Minimalista, Tecnológico, Ejecutivo, ATS | Diseño y código originales de CV Studio | MIT (proyecto CV Studio) | Se renderizan localmente con React y CSS. |
| JSON Resume · Class | Esquema JSON Resume y guía oficial para temas; referencia visual general: `jsonresume-theme-class` | MIT para el ecosistema/tema de referencia. El diseño y código de CV Studio son una implementación independiente; no se copia ni distribuye el código del tema externo. | Adaptador de datos JSON Resume 1.x hacia el modelo único y render local. |
| Reactive Resume | https://github.com/reactive-resume/reactive-resume | MIT del repositorio (revisado 2026-11-04) | Analizado. No se incorporaron archivos, componentes, diseños ni dependencias del repositorio: aunque el proyecto declara MIT, una integración de código requeriría inventariar licencias de cada paquete y artefacto antes de copiarlo. |
| JSON Resume schema/docs | https://jsonresume.org/docs/guides/schema y https://jsonresume.org/docs/guides/themes | MIT (proyecto JSON Resume) | Se implementa un adaptador de intercambio sin incorporar código de temas externos. Campos propios se guardan bajo `custom.cvStudio`. |
| Canva Connect | https://www.canva.dev/docs/apps/rest-apis/authentication/ | API de Canva; requiere app registrada, credenciales y consentimiento OAuth del usuario | Integración opcional del servidor. Lista únicamente diseños autorizados de la cuenta del usuario; no consulta ni scrapea una galería pública. |

Las dependencias directas existentes se revisaron en sus metadatos instalados: React/React DOM, `@react-pdf/renderer`, Vite, Tailwind CSS, PostCSS, Autoprefixer y Vite React Plugin declaran MIT; `lucide-react` declara ISC. No se añadió ningún paquete de tema externo.

## Política de incorporación

Las plantillas de terceros solo se integrarán después de comprobar la licencia de los archivos a copiar y las licencias de sus dependencias distribuibles. Las plantillas locales no dependen de servicios pagos ni descargan temas en tiempo de ejecución. Canva requiere configurar un cliente en Canva Developers y ejecutar el backend de integración; la credencial secreta no debe exponerse al frontend.
