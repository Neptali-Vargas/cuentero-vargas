// Pantalla 2: el editor. Sirve para crear y para editar, segun el id de la ruta.
// /cuento/nuevo  -> formulario vacio
// /cuento/7      -> formulario con el cuento 7
import { useEffect, useRef, useState } from 'react';
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
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

export default function Editor() {
  const db = useSQLiteContext();
  const router = useRouter();
  const navigation = useNavigation();

  // id viene de la URL y SIEMPRE es texto, por eso se usa Number(id) en el SQL
  const { id } = useLocalSearchParams();
  const esNuevo = id === 'nuevo';

  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');

  // T4: avisa si el usuario escribio algo. Un ref porque lo leemos dentro de
  // un listener sin que ese valor dispare un nuevo dibujado.
  const modificado = useRef(false);
  // se pone en true cuando YA se decidio salir, para no volver a preguntar
  const salirPermitido = useRef(false);

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

  // T4: beforeRemove se dispara cuando navigation va a sacar esta pantalla de
  // la pila (boton atras, gesto, o router.back). preventDefault() lo cancela y
  // da tiempo a preguntar al usuario.
  useEffect(() => {
    const subscription = navigation.addListener('beforeRemove', (evento) => {
      if (salirPermitido.current || !modificado.current) return;

      evento.preventDefault();

      Alert.alert(
        'Salir sin guardar',
        'Tienes cambios sin guardar. Si sales ahora se perderan.',
        [
          { text: 'Seguir editando', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => {
              salirPermitido.current = true;
              // se reenvia la accion original, ya sin la pregunta
              navigation.dispatch(evento.data.action);
            },
          },
        ]
      );
    });

    return subscription;
  }, [navigation]);

  // T2: cuenta de palabras. trim() quita los espacios de los extremos y
  // split(/\s+/) parte el texto por espacios. Si esta vacio, split devuelve
  // [''] (un elemento vacio), por eso el || 0.
  const palabras = cuerpo.trim() ? cuerpo.trim().split(/\s+/).length : 0;

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
    // se marca que ya se puede salir sin preguntar
    salirPermitido.current = true;
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
          salirPermitido.current = true;
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
        onChangeText={(texto) => {
          setTitulo(texto);
          modificado.current = true;
        }}
      />

      <TextInput
        style={styles.cuerpo}
        placeholder="Habia una vez, en la quebrada..."
        value={cuerpo}
        onChangeText={(texto) => {
          setCuerpo(texto);
          modificado.current = true;
        }}
        multiline
        textAlignVertical="top"
      />

      {/* T2: cuantas palabras lleva escritas, se actualiza mientras se escribe */}
      <Text style={styles.contador}>
        {palabras} {palabras === 1 ? 'palabra' : 'palabras'}
      </Text>

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
  contador: { fontSize: 12, color: '#7a8b7f', textAlign: 'right' },
  guardar: {
    backgroundColor: '#1b4332',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  guardarTexto: { color: '#fff', fontWeight: '600' },
  borrar: { textAlign: 'center', color: '#a4161a', paddingVertical: 10 },
});
