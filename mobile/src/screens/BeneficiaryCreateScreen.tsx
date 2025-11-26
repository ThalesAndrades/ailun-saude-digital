import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native'
import FormField from '../components/FormField'
import { addBeneficiaries } from '../api/client'
import { formatCPF, formatCEP, formatPhone, validCEP, validCPF, validDateISO, validEmail, validPhone } from '../utils/validation'

export default function BeneficiaryCreateScreen() {
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [birthday, setBirthday] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
  const [paymentType, setPaymentType] = useState('S')
  const [serviceType, setServiceType] = useState('G')
  const [holder, setHolder] = useState('')
  const [general, setGeneral] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [status, setStatus] = useState('')

  function addItem() {
    const item = { name: name.trim(), cpf: cpf.trim(), birthday: birthday.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, zipCode: zip.trim() || undefined, paymentType, serviceType, holder: holder.trim() || undefined, general: general.trim() || undefined }
    if (!item.name || !item.cpf || !item.birthday) { setStatus('Preencha Nome, CPF e Nascimento'); return }
    if (!validCPF(item.cpf)) { setStatus('CPF inválido'); return }
    if (!validDateISO(item.birthday)) { setStatus('Nascimento inválido (yyyy-MM-dd)'); return }
    if (!validEmail(item.email)) { setStatus('Email inválido'); return }
    if (!validPhone(item.phone)) { setStatus('Telefone inválido'); return }
    if (!validCEP(item.zipCode)) { setStatus('CEP inválido'); return }
    setItems([...items, item])
    setStatus('')
  }

  async function submitAll() {
    try {
      setStatus('Enviando...')
      const data = await addBeneficiaries(items)
      setStatus('Processamento concluído')
      setItems([])
    } catch (err: any) { setStatus(err.message) }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastrar Beneficiário</Text>
      <FormField label="Nome" value={name} onChangeText={setName} />
      <FormField label="CPF" value={cpf} onChangeText={(v: string) => setCpf(formatCPF(v))} keyboardType="number-pad" />
      <FormField label="Nascimento (yyyy-MM-dd)" value={birthday} onChangeText={setBirthday} />
      <FormField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <FormField label="Telefone" value={phone} onChangeText={(v: string) => setPhone(formatPhone(v))} keyboardType="phone-pad" />
      <FormField label="CEP" value={zip} onChangeText={(v: string) => setZip(formatCEP(v))} keyboardType="number-pad" />
      <FormField label="Titular (CPF)" value={holder} onChangeText={setHolder} />
      <FormField label="General" value={general} onChangeText={setGeneral} />
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={addItem}><Text style={styles.buttonText}>Adicionar à lista</Text></TouchableOpacity>
        <TouchableOpacity style={styles.buttonOutline} onPress={() => setItems([])}><Text style={styles.buttonText}>Limpar lista</Text></TouchableOpacity>
      </View>
      <FlatList data={items} keyExtractor={(_, i) => String(i)} renderItem={({ item }) => (
        <View style={styles.item}><Text style={styles.itemText}>{item.name} • CPF {item.cpf} • {item.birthday}</Text></View>
      )} />
      <TouchableOpacity style={styles.button} onPress={submitAll}><Text style={styles.buttonText}>Cadastrar Todos</Text></TouchableOpacity>
      {!!status && <Text style={styles.status}>{status}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { color: '#e2e8f0', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  button: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonOutline: { backgroundColor: '#0b1220', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  item: { padding: 8, borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, marginVertical: 4 },
  itemText: { color: '#93c5fd' },
  status: { marginTop: 12, color: '#93c5fd' }
})