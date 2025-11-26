import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native'
import FormField from '../components/FormField'
import { listBeneficiaries, findBeneficiaryByCPF, reactivateBeneficiary, updateBeneficiary } from '../api/client'
import { onlyDigits } from '../utils/validation'

export default function BeneficiariesScreen() {
  const [cpf, setCpf] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [status, setStatus] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  async function loadAll() {
    setStatus('Carregando...')
    const d = await listBeneficiaries()
    setItems((d as any).beneficiaries || (d as any).data || [])
    setStatus('')
  }
  async function findByCPF() {
    setStatus('Buscando...')
    const d = await findBeneficiaryByCPF(onlyDigits(cpf))
    const list = Array.isArray((d as any).beneficiaries) ? (d as any).beneficiaries : ((d as any).data ? [(d as any).data] : [])
    setItems(list)
    setStatus('')
  }
  async function save() {
    if (!selected?.uuid) { setStatus('Selecione um beneficiário'); return }
    setStatus('Atualizando...')
    await updateBeneficiary(selected.uuid, { email: email || undefined, phone: onlyDigits(phone) || undefined, zipCode: onlyDigits(zipCode) || undefined, address: address || undefined, city: city || undefined, state: state.toUpperCase() || undefined })
    setStatus('Atualizado')
  }
  async function reactivate() {
    if (!selected?.uuid) { setStatus('Selecione um beneficiário'); return }
    setStatus('Reativando...')
    await reactivateBeneficiary(selected.uuid)
    setStatus('Reativado')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Beneficiários</Text>
      <View style={styles.row}>
        <FormField label="CPF" value={cpf} onChangeText={setCpf} />
        <TouchableOpacity style={styles.button} onPress={findByCPF}><Text style={styles.buttonText}>Buscar</Text></TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={loadAll}><Text style={styles.buttonText}>Carregar</Text></TouchableOpacity>
      </View>
      <FlatList data={items} keyExtractor={(item) => String(item.uuid || Math.random())} renderItem={({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => { setSelected(item); setEmail(item.email || ''); setPhone(item.phone || ''); setZipCode(item.zipCode || ''); setAddress(item.address || ''); setCity(item.city || ''); setState(item.state || '') }}>
          <Text style={styles.itemText}>{item.name || ''}</Text>
          <Text style={styles.itemSub}>{item.uuid || ''}</Text>
          <Text style={styles.itemSub}>{item.isActive === false ? 'inativo' : 'ativo'}</Text>
        </TouchableOpacity>
      )} />
      {selected && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.subtitle}>Selecionado: {selected.uuid}</Text>
          <FormField label="Email" value={email} onChangeText={setEmail} />
          <FormField label="Telefone" value={phone} onChangeText={setPhone} />
          <FormField label="CEP" value={zipCode} onChangeText={setZipCode} />
          <FormField label="Endereço" value={address} onChangeText={setAddress} />
          <FormField label="Cidade" value={city} onChangeText={setCity} />
          <FormField label="Estado" value={state} onChangeText={setState} />
          <View style={styles.row}>
            <TouchableOpacity style={styles.button} onPress={save}><Text style={styles.buttonText}>Salvar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={reactivate}><Text style={styles.buttonText}>Reativar</Text></TouchableOpacity>
          </View>
        </View>
      )}
      {!!status && <Text style={styles.status}>{status}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { color: '#e2e8f0', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  subtitle: { color: '#93c5fd', marginTop: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  button: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  item: { padding: 8, borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, marginVertical: 4 },
  itemText: { color: '#93c5fd', fontWeight: '600' },
  itemSub: { color: '#e2e8f0' },
  status: { marginTop: 12, color: '#93c5fd' }
})