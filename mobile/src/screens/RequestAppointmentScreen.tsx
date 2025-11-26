import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import FormField from '../components/FormField'
import { requestAppointment } from '../api/client'
import { validUUID } from '../utils/validation'

export default function RequestAppointmentScreen() {
  const [uuid, setUuid] = useState('')
  const [status, setStatus] = useState('')
  const [url, setUrl] = useState('')

  async function submit() {
    setStatus('')
    if (!validUUID(uuid.trim())) { setStatus('UUID inválido'); return }
    try {
      setStatus('Solicitando...')
      const data = await requestAppointment(uuid.trim())
      setStatus('URL gerada')
      setUrl(String((data as any).url || ''))
    } catch (err: any) { setStatus(err.message) }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solicitar Atendimento</Text>
      <FormField label="UUID do Beneficiário" value={uuid} onChangeText={setUuid} />
      <TouchableOpacity style={styles.button} onPress={submit}><Text style={styles.buttonText}>Solicitar</Text></TouchableOpacity>
      {!!url && <TouchableOpacity onPress={() => Linking.openURL(url)}><Text style={styles.link}>Abrir atendimento</Text></TouchableOpacity>}
      {!!status && <Text style={styles.status}>{status}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { color: '#e2e8f0', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  button: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: '#93c5fd', marginTop: 8 },
  status: { marginTop: 12, color: '#93c5fd' }
})