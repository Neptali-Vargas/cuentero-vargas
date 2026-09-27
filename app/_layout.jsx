// Envoltura comun de todas las pantallas.
// Aqui se abre la base de datos UNA sola vez y se comparte con el resto de pantallas.
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

// Se ejecuta al abrir la base. Por eso la tabla se crea con IF NOT EXISTS:
// asi se puede ejecutar en cada arranque sin romper nada.
async function iniciarBD(db) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS cuento (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo  TEXT NOT NULL,
      cuerpo  TEXT NOT NULL DEFAULT '',
      creado  TEXT NOT NULL,
      editado TEXT NOT NULL
    );
  `);
}

export default function Layout() {
  return (
    // useSuspense hace que las pantallas esperen a que la base este lista.
    <Suspense
      fallback={
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      }
    >
      <SQLiteProvider databaseName="cuentero.db" onInit={iniciarBD} useSuspense>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#1b4332' },
            headerTintColor: '#fff',
          }}
        />
      </SQLiteProvider>
    </Suspense>
  );
}
