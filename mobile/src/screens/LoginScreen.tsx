import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import FormField from '../components/FormField'
import { login } from '../api/client'
import * as SecureStore from 'expo-secure-store'

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [role, setRole] = useState<'paciente'|'admin'>('paciente')

  async function onSubmit() {
    setStatus('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      setStatus('Login realizado com sucesso')
      navigation.replace(role === 'paciente' ? 'DashboardPatient' : 'DashboardAdmin')
    } catch (err: any) {
      setStatus(err.message || 'Falha na autenticação')
    } finally { setLoading(false) }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ailun Saúde</Text>
      <FormField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <FormField label="Senha" value={password} onChangeText={setPassword} secureTextEntry />
      <View style={styles.roleRow}>
        <TouchableOpacity style={[styles.roleButton, role==='paciente'&&styles.roleActive]} onPress={() => setRole('paciente')}><Text style={styles.roleText}>Paciente</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.roleButton, role==='admin'&&styles.roleActive]} onPress={() => setRole('admin')}><Text style={styles.roleText}>Administrador</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </TouchableOpacity>
      {!!status && <Text style={styles.status}>{status}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16, justifyContent: 'center' },
  title: { color: '#e2e8f0', fontSize: 22, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  button: { height: 44, backgroundColor: '#3b82f6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  roleButton: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1220' },
  roleActive: { borderColor: '#3b82f6' },
  roleText: { color: '#e2e8f0', fontWeight: '600' },
  status: { marginTop: 12, color: '#93c5fd', textAlign: 'center' }
})