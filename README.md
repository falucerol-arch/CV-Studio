# CV Studio

Aplicación local de React + Vite para editar CVs en un único modelo, cambiar entre plantillas y exportar a PDF, JSON Resume o HTML autocontenido.

## Inicio rápido

```sh
npm install
npm run dev
```

Abre la URL local que muestra Vite. Los CV se guardan en LocalStorage del navegador.

## Publicar en GitHub Pages

El workflow `.github/workflows/deploy.yml` instala dependencias con `npm ci`, compila la aplicación y publica `dist` cuando hay un push a `main` (también se puede iniciar manualmente desde Actions). En GitHub, abre **Settings → Pages** y selecciona **GitHub Actions** como fuente de publicación.

La aplicación pública estará en <https://falucerol-arch.github.io/CV-Studio/>. Vite utiliza `/CV-Studio/` como base en compilaciones de producción y mantiene `/` en desarrollo local, así que los recursos compilados cargan desde la ruta correcta del repositorio. Las pantallas usan rutas hash compatibles con GitHub Pages: `#/inicio`, `#/curriculums` y `#/editar/ID/seccion`. Esto permite recargar o compartir la URL sin pedir al servidor una ruta que no existe.

Los currículums se guardan en el LocalStorage de cada navegador y la descarga PDF se genera en el cliente. No se sincronizan entre usuarios ni navegadores. **Canva Connect** sí necesita el backend Node de `server/` y credenciales OAuth; GitHub Pages solo sirve archivos estáticos, por lo que ese backend debe alojarse aparte antes de habilitar Canva en producción.

## Formatos y plantillas

- El adaptador JSON Resume 1.x importa y exporta el formato estándar. Los datos específicos de CV Studio viajan en `custom.cvStudio` para conservarlos al hacer un ciclo de exportación e importación.
- Las plantillas locales se describen en `src/templates/registry.js`. El motor actual usa React/HTML/CSS y `@react-pdf/renderer`.
- La opción **JSON Resume · Class** también descarga un HTML independiente. Su función `render(resume)` acepta el objeto estándar y genera un documento con CSS integrado, sin dependencias de red.
- Azurill, Bronzor y Chikorita adaptan tres layouts de Reactive Resume al formulario y los datos existentes; cada una se dibuja en HTML y en `@react-pdf/renderer`. La licencia y matriz del catálogo de 18 layouts están en `TEMPLATE_SOURCES.md`; el texto MIT está en `THIRD_PARTY_NOTICES.md`.
- El listado de fuentes de Canva se limita a los diseños que el usuario autorizó en su cuenta; no se carga una galería pública de Canva.

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
