# Guía para asistentes de IA

Este es un proyecto móvil con Expo y React Native. Prioriza los patrones de desarrollo
móvil, el rendimiento y la compatibilidad entre plataformas.

## Expo cambia seguido: no confíes en la memoria

Expo publica cambios que rompen la compatibilidad en cada versión del SDK. Es probable que
las APIs que recuerdes hayan sido renombradas, movidas o eliminadas. Antes de escribir código
que toque una API de Expo, EAS o React Native:

1. Revisa la versión mayor de `expo` en `package.json`.
2. Consulta la documentación de esa misma versión:
   `https://docs.expo.dev/versions/v<mayor>.0.0/`

## Comandos

```bash
npx expo install <paquete>   # SIEMPRE en vez de npm add: instala la versión compatible con el SDK
npx expo start               # inicia el servidor de desarrollo
npx expo lint                # analiza el código
npx expo-doctor              # diagnostica problemas de dependencias y de configuración
```

## Navegación y rutas

- Usa **Expo Router** para toda la navegación. Las rutas viven en `app/` — cada archivo
  ahí es una pantalla, y los archivos `_layout.jsx` definen los navegadores.
- Importa `useRouter` y `useLocalSearchParams` desde `expo-router`.
- Documentación: https://docs.expo.dev/router/introduction.md

## Base de datos

- La base de datos se abre **una sola vez** en `app/_layout.jsx`, dentro de
  `<SQLiteProvider>`. Desde ahí se obtiene con `useSQLiteContext()`.
- El archivo `.jsx` dentro de corchetes (por ejemplo `app/cuento/[id].jsx`) recibe
  parámetros de la ruta como texto. Conviértelos con `Number(id)` antes de usarlos en SQL.
- Nunca pegues texto dentro de una consulta SQL. Usa siempre parámetros `?`.

## Reglas

- Si las carpetas `ios/` y `android/` no existen, no las crees a mano: configura
  `app.json` y los plugins de configuración.
- Expo Go solo incluye los módulos nativos que ya trae. Si agregas una librería con
  código nativo, se necesita una compilación de desarrollo.
- Prefiere los módulos recomendados de Expo sobre librerías de terceros.
