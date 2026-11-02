# A cuenta

Una app personal de gastos en español, hecha con Expo, React Native y TypeScript para Android, iOS y web.

## Primera versión

- Gastos diarios con importe, categoría, fecha y descripción opcional.
- Gastos fijos que se incluyen cada mes desde el mes seleccionado.
- Resumen mensual y distribución por categoría.
- Categorías con emojis, incluyendo café y snacks y comer fuera.
- Resumen y filtro de gastos hormiga: gastos diarios de hasta 10 €, sin incluir fijos.
- Filtros, edición y eliminación de gastos diarios.
- Modificación o baja de gastos fijos sin alterar los meses anteriores.
- Almacenamiento local, sin registro ni servicios externos.

El total mensual suma los gastos diarios registrados y los fijos **previstos**, aunque todavía no se hayan pagado. No registres un fijo también como gasto diario, porque se contaría dos veces. Los importes se calculan en céntimos y se muestran en euros.

## Desarrollo

Requisitos: Node.js 24 y npm. Desde la raíz del repositorio:

```sh
npm ci
npm run web
```

En el entorno en la nube, si la API de Expo no está permitida, usa la tabla de compatibilidad incluida en el SDK y arranca sin consultas remotas:

```sh
EXPO_OFFLINE=1 npm run web -- --port 8081
```

Para desarrollar en móvil, usa una compilación de desarrollo de Expo con los módulos nativos de este proyecto. La compilación y firma requieren las herramientas y credenciales de Android/iOS o una configuración de EAS. No se han generado APK, IPA ni publicaciones en tiendas.

```sh
npm start
```

## Comprobaciones

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build:web
```

Las pruebas de lógica cubren importes, fechas, totales, recurrencia e integridad del almacenamiento. Las pruebas funcionales usan Chromium en un tamaño de móvil para crear, editar, filtrar, guardar, recargar y eliminar gastos. `test:e2e` arranca el servidor y lo detiene al terminar. Usa `/usr/bin/chromium` por defecto; puedes indicar otra ruta con `CHROMIUM_PATH`.

Los paquetes JavaScript nativos también pueden validarse con `EXPO_OFFLINE=1 npx expo export --platform android` y `--platform ios`. Exportar estos paquetes no equivale a probar la app en un dispositivo ni a generar un instalador.

## Datos

Se usa AsyncStorage con la clave `mis-gastos:v1`. En web, los datos pertenecen al navegador y al origen; en móvil, a la instalación. Borrar los datos de la aplicación o del navegador elimina el registro. Esta versión no incluye copia de seguridad, sincronización, cifrado propio, conexión bancaria ni categorías personalizadas.

Los archivos con datos dañados o formatos desconocidos provocan un aviso de lectura; no se sustituyen por un registro vacío. Si un guardado falla, el formulario permanece abierto para reintentarlo.

## Estructura

- `src/app/`: las tres pantallas y la navegación con Expo Router.
- `src/components/ExpensesScreen.tsx`: interfaz y formularios.
- `src/lib/expenses.ts`: importes, fechas, categorías y cálculos.
- `src/lib/store.tsx`: estado compartido y persistencia.
- `tests/`: pruebas de lógica y de navegador.

Cada tarea en la nube ya está aislada. Trabaja en el checkout existente; no es necesario crear un Git worktree.

## Publicación web para iPhone

```sh
EXPO_OFFLINE=1 npm run build:pages
node scripts/check-web.mjs
```

`build:pages` prepara `dist/` para la subruta `/GASTOS-APP/` de GitHub Pages. Incluye el icono, el manifiesto y los metadatos para añadir la web a la pantalla de inicio de iPhone. `check-web.mjs` sirve temporalmente esa exportación y verifica los recursos, el registro de un gasto, la navegación y la persistencia al recargar una ruta interna.

El contenido de `dist/` se publica en la raíz de la rama `gh-pages` del repositorio. En **Settings → Pages**, el origen debe ser **Deploy from a branch → gh-pages → / (root)**. La dirección prevista es `https://matijfproyect.github.io/GASTOS-APP/`; no está disponible hasta que GitHub Pages esté activado y su despliegue termine.

En el iPhone, abre la dirección publicada en Safari y usa **Compartir → Añadir a pantalla de inicio**. El almacenamiento sigue siendo local y esta versión necesita conexión para cargar la web; no incluye caché de uso sin conexión.

Para otro alojamiento que sirva desde la raíz del dominio, usa `npm run build:web` sin `WEB_BASE_PATH`. Mantén estable el dominio: cambiarlo no traslada automáticamente los datos del navegador.
