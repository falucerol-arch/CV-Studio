# CV Studio

Aplicación local de React + Vite para editar CVs en un único modelo, cambiar entre plantillas y exportar a PDF, JSON Resume o HTML autocontenido.

## Inicio rápido

```sh
npm install
npm run dev
```

Abre la URL local que muestra Vite. Los CV se guardan en LocalStorage del navegador.

## Formatos y plantillas

- El adaptador JSON Resume 1.x importa y exporta el formato estándar. Los datos específicos de CV Studio viajan en `custom.cvStudio` para conservarlos al hacer un ciclo de exportación e importación.
- Las plantillas locales se describen en `src/templates/registry.js`. El motor actual usa React/HTML/CSS y `@react-pdf/renderer`.
- La opción **JSON Resume · Class** también descarga un HTML independiente. Su función `render(resume)` acepta el objeto estándar y genera un documento con CSS integrado, sin dependencias de red.
- El listado y la licencia de fuentes están en `TEMPLATE_SOURCES.md`. No se copia código de Reactive Resume ni se carga una galería pública de Canva.

## Pruebas y compilación

```sh
npm test
npm run build
```

## Canva Connect opcional

Canva necesita credenciales de una integración creada en Canva Developers. Copia `.env.example` a `.env`, completa `CANVA_CLIENT_ID` y `CANVA_CLIENT_SECRET`, y registra la URL de redirección indicada en el archivo de entorno. En dos terminales ejecuta:

```sh
npm run dev:api
npm run dev
```

El backend guarda temporalmente los tokens en memoria y está pensado para una instancia de desarrollo de un solo usuario. En producción se debe asociar cada token a la sesión autenticada de su propietario y almacenarlo cifrado. El secreto de Canva nunca debe exponerse mediante variables `VITE_*`. El usuario otorga acceso OAuth antes de que CV Studio liste diseños de su cuenta.

## Dependencias directas revisadas

| Paquete | Licencia declarada |
|---|---|
| `react`, `react-dom` | MIT |
| `@react-pdf/renderer` | MIT |
| `lucide-react` | ISC |
| `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer` | MIT |

No se agregaron dependencias externas de temas para esta integración.
