// Pantalla 1: la lista de cuentos.
// Los datos salen de SQLite, no estan escritos en el codigo.
import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

export default function Lista() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [cuentos, setCuentos] = useState([]);

  // useFocusEffect (y no useEffect) porque la lista NO se vuelve a montar al
  // volver con router.back(): sigue viva debajo en la pila. Con useEffect el
  // cuento nuevo no apareceria.
  useFocusEffect(
    useCallback(() => {
      // esta variable evita actualizar un componente ya desmontado
      let activo = true;

      async function cargar() {
        const filas = await db.getAllAsync(
          'SELECT id, titulo, editado FROM cuento ORDER BY editado DESC'
        );
        if (activo) setCuentos(filas);
      }
      cargar();

      // lo que devuelve useFocusEffect se ejecuta al salir de la pantalla
      return () => {
        activo = false;
      };
    }, [db])
  );

  return (
    <View style={styles.contenedor}>
      <Stack.Screen
        options={{
          title: 'Cuentero',
          headerRight: () => (
            <Pressable onPress={() => router.push('/ajustes')}>
              <Text style={styles.ajustes}>Ajustes</Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={cuentos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <Text style={styles.vacio}>Todavia no hay cuentos. Toca + para escribir el primero.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.tarjeta}
            onPress={() => router.push(`/cuento/${item.id}`)}
          >
            <Text style={styles.tarjetaTitulo}>{item.titulo}</Text>
            <Text style={styles.tarjetaFecha}>
              {new Date(item.editado).toLocaleDateString('es-PE')}
            </Text>
          </Pressable>
        )}
      />

      <Pressable style={styles.boton} onPress={() => router.push('/cuento/nuevo')}>
        <Text style={styles.botonTexto}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f7f5f0' },
  ajustes: { color: '#fff', fontSize: 16 },
  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8e2d5',
  },
  tarjetaTitulo: { fontSize: 16, fontWeight: '600', color: '#1b4332' },
  tarjetaFecha: { fontSize: 12, color: '#7a8b7f', marginTop: 4 },
  vacio: { textAlign: 'center', color: '#7a8b7f', marginTop: 40 },
  boton: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1b4332',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  botonTexto: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
