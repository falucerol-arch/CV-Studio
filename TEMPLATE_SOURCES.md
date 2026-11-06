# Registro de fuentes y licencias de plantillas

| Plantilla / componente | Fuente | Licencia revisada | Uso en CV Studio |
|---|---|---|---|
| Profesional, Moderno, Minimalista, Tecnológico, Ejecutivo, ATS, Corporativo, Creativo, Elegante, Compacto | Diseño y código originales de CV Studio | MIT (proyecto CV Studio) | Se renderizan localmente con React y CSS y se exportan con el motor PDF local. |
| JSON Resume · Class | Esquema JSON Resume y guía oficial para temas; referencia visual general: `jsonresume-theme-class` | MIT para el ecosistema/tema de referencia. El diseño y código de CV Studio son una implementación independiente; no se copia ni distribuye el código del tema externo. | Adaptador de datos JSON Resume 1.x hacia el modelo único y render local. |
| 18 plantillas Reactive Resume | https://github.com/reactive-resume/reactive-resume/tree/main/packages/pdf/src/templates | MIT del repositorio | Adaptaciones de los 18 layouts con el modelo y formulario de CV Studio, usando sus renderizadores React/HTML y `@react-pdf/renderer`. Azurill, Bronzor y Chikorita aportan las tres estructuras iniciales representativas; las 15 restantes reutilizan la composición compartida y aportan variantes de una o dos columnas. No se copiaron componentes ni el motor PDF/Forme de Reactive Resume. |
| JSON Resume schema/docs | https://jsonresume.org/docs/guides/schema y https://jsonresume.org/docs/guides/themes | MIT (proyecto JSON Resume) | Se implementa un adaptador de intercambio sin incorporar código de temas externos. Campos propios se guardan bajo `custom.cvStudio`. |
| Canva Connect | https://www.canva.dev/docs/apps/rest-apis/authentication/ | API de Canva; requiere app registrada, credenciales y consentimiento OAuth del usuario | Integración opcional del servidor. Lista únicamente diseños autorizados de la cuenta del usuario; no consulta ni scrapea una galería pública. |

Las dependencias directas existentes se revisaron en sus metadatos instalados: React/React DOM, `@react-pdf/renderer`, Vite, Tailwind CSS, PostCSS, Autoprefixer y Vite React Plugin declaran MIT; `lucide-react` declara ISC. No se añadió ningún paquete de tema externo.

## Análisis del catálogo de Reactive Resume

La documentación del proyecto describe 18 layouts agrupados por columnas y compatibilidad ATS. Sus componentes PDF comparten primitivas de encabezado, secciones, tipografía, colores y filtrado de secciones; cada plantilla compone esas primitivas en un layout propio. La arquitectura actual convierte los componentes React a documentos PDF mediante Forme, mientras CV Studio mantiene el render HTML en React y un exportador PDF independiente con `@react-pdf/renderer`. Por eso las nuevas variantes se adaptan a ambos renderizadores en vez de importar Forme o el monorepo.

| Plantilla de referencia | Columnas | ATS | Lado de la barra | Estado en CV Studio |
|---|---:|---:|---|---|
| Azurill | 2 | No | Izquierda | Adaptada (primera fase) |
| Bronzor | 1 | Sí | — | Adaptada (primera fase) |
| Chikorita | 2 | No | Derecha | Adaptada (primera fase) |
| Ditgar | 2 | No | Izquierda | Adaptada |
| Ditto | 2 | No | Izquierda | Adaptada |
| Gengar | 2 | No | Izquierda | Adaptada |
| Glalie | 2 | No | Izquierda | Adaptada |
| Kakuna | 1 | Sí | — | Adaptada |
| Lapras | 1 | Sí | — | Adaptada |
| Leafish | 2 | No | Derecha | Adaptada |
| Meowth | 1 | Sí | — | Adaptada |
| Onyx | 1 | Sí | — | Adaptada |
| Persian | 1 | Sí | — | Adaptada |
| Pikachu | 2 | No | Izquierda | Adaptada |
| Porygon | 1 | Sí | — | Adaptada |
| Rhyhorn | 1 | Sí | — | Adaptada |
| Scizor | 1 | Sí | — | Adaptada |
| Smeargle | 1 | Sí | — | Adaptada |

Las 18 opciones están registradas como variantes de HTML y PDF, reutilizan los mismos datos guardados y respetan los controles de tipografía, tamaño, fotografía y color de CV Studio. Las opciones de lado y ancho de columna se guardan con la personalización del documento. El editor genera miniaturas con el contenido actual del currículum.

## Política de incorporación

Las plantillas de terceros solo se integrarán después de comprobar la licencia de los archivos a copiar y las licencias de sus dependencias distribuibles. Las plantillas locales no dependen de servicios pagos ni descargan temas en tiempo de ejecución. Canva requiere configurar un cliente en Canva Developers y ejecutar el backend de integración; la credencial secreta no debe exponerse al frontend.
