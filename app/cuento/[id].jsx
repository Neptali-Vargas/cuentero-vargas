// Pantalla 2: el editor. Sirve para crear y para editar, segun el id de la ruta.
// /cuento/nuevo  -> formulario vacio
// /cuento/7      -> formulario con el cuento 7
import { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

export default function Editor() {
  const db = useSQLiteContext();
  const router = useRouter();

  // id viene de la URL y SIEMPRE es texto, por eso se usa Number(id) en el SQL
  const { id } = useLocalSearchParams();
  const esNuevo = id === 'nuevo';

  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');

  // useEffect con [] : se ejecuta una sola vez, cuando aparece la pantalla
  useEffect(() => {
    if (esNuevo) return;

    async function cargar() {
      const fila = await db.getFirstAsync(
        'SELECT titulo, cuerpo FROM cuento WHERE id = ?',
        [Number(id)]
      );
      // la validacion es necesaria: getFirstAsync devuelve null si no hay nada
      if (fila) {
        setTitulo(fila.titulo);
        setCuerpo(fila.cuerpo);
      }
    }
    cargar();
  }, [id, esNuevo, db]);

  // CREAR o ACTUALIZAR. Los ? son parametros: nunca se pega texto dentro del SQL.
  async function guardar() {
    const limpio = titulo.trim();
    if (!limpio) {
      Alert.alert('Falta el titulo', 'Todo cuento necesita un nombre.');
      return;
    }

    // las fechas van como texto ISO, porque en SQLite no existe el tipo fecha
    const ahora = new Date().toISOString();

    if (esNuevo) {
      await db.runAsync(
        'INSERT INTO cuento (titulo, cuerpo, creado, editado) VALUES (?, ?, ?, ?)',
        [limpio, cuerpo, ahora, ahora]
      );
    } else {
      await db.runAsync(
        'UPDATE cuento SET titulo = ?, cuerpo = ?, editado = ? WHERE id = ?',
        [limpio, cuerpo, ahora, Number(id)]
      );
    }
    router.back();
  }

  // BORRAR, con confirmacion
  function confirmarBorrado() {
    Alert.alert('Borrar cuento', 'Esta accion no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await db.runAsync('DELETE FROM cuento WHERE id = ?', [Number(id)]);
          router.back();
        },
      },
    ]);
  }

  return (
    // KeyboardAvoidingView levanta el contenido para que el teclado no lo tape
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: esNuevo ? 'Nuevo cuento' : 'Editar cuento' }} />

      <TextInput
        style={styles.titulo}
        placeholder="Titulo del cuento"
        value={titulo}
        onChangeText={setTitulo}
      />

      <TextInput
        style={styles.cuerpo}
        placeholder="Habia una vez, en la quebrada..."
        value={cuerpo}
        onChangeText={setCuerpo}
        multiline
        textAlignVertical="top"
      />

      <Pressable style={styles.guardar} onPress={guardar}>
        <Text style={styles.guardarTexto}>Guardar</Text>
      </Pressable>

      {!esNuevo && (
        <Pressable onPress={confirmarBorrado}>
          <Text style={styles.borrar}>Borrar este cuento</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f7f5f0', padding: 16, gap: 12 },
  titulo: {
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e2d5',
  },
  cuerpo: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e2d5',
  },
  guardar: {
    backgroundColor: '#1b4332',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  guardarTexto: { color: '#fff', fontWeight: '600' },
  borrar: { textAlign: 'center', color: '#a4161a', paddingVertical: 10 },
});
