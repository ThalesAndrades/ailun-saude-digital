import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native'
import FormField from '../components/FormField'
import { listSpecialties, listAvailability, listReferrals, scheduleAppointment } from '../api/client'
import { validUUID } from '../utils/validation'

export default function ScheduleScreen() {
  const [beneficiaryUuid, setBeneficiaryUuid] = useState('')
  const [type, setType] = useState<'MEDICA'|'NUTRICAO'|'PSICOLOGIA'>('MEDICA')
  const [specialtyUuid, setSpecialtyUuid] = useState('')
  const [availabilityUuid, setAvailabilityUuid] = useState('')
  const [referralUuid, setReferralUuid] = useState('')
  const [status, setStatus] = useState('')
  const [specialties, setSpecialties] = useState<any[]>([])
  const [availability, setAvailability] = useState<any[]>([])
  const [referrals, setReferrals] = useState<any[]>([])

  async function loadSpecs() {
    setStatus('Carregando especialidades...')
    const d = await listSpecialties()
    const list = (d as any).specialties || (d as any).data || []
    setSpecialties(list)
    setStatus('')
  }
  async function loadAvail() {
    setStatus('Carregando disponibilidade...')
    const d = await listAvailability({ specialtyUuid: specialtyUuid.trim(), beneficiaryUuid: beneficiaryUuid.trim() })
    const items = (d as any).items || (d as any).availability || (d as any).data || []
    setAvailability(items)
    setStatus('')
  }
  async function loadRefs() {
    setStatus('Carregando encaminhamentos...')
    const d = await listReferrals(beneficiaryUuid.trim())
    const items = (d as any).referrals || (d as any).data || []
    setReferrals(items)
    setStatus('')
  }
  async function schedule() {
    if (!validUUID(beneficiaryUuid.trim())) { setStatus('UUID do beneficiário inválido'); return }
    if (!validUUID(specialtyUuid.trim())) { setStatus('UUID da especialidade inválido'); return }
    if (!validUUID(availabilityUuid.trim())) { setStatus('UUID da disponibilidade inválido'); return }
    if (type === 'MEDICA' && !validUUID(referralUuid.trim())) { setStatus('Encaminhamento obrigatório para especialidade médica'); return }
    setStatus('Agendando...')
    const payload: any = { beneficiaryUuid: beneficiaryUuid.trim(), availabilityUuid: availabilityUuid.trim(), specialtyUuid: specialtyUuid.trim(), approveAdditionalPayment: true }
    if (type === 'MEDICA') payload.beneficiaryMedicalReferralUuid = referralUuid.trim()
    try {
      await scheduleAppointment(payload)
      setStatus('Agendado')
    } catch (err: any) { setStatus(err.message) }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agendar Consulta</Text>
      <FormField label="UUID do Beneficiário" value={beneficiaryUuid} onChangeText={setBeneficiaryUuid} />
      <FormField label="UUID da Especialidade" value={specialtyUuid} onChangeText={setSpecialtyUuid} />
      <FormField label="UUID da Disponibilidade" value={availabilityUuid} onChangeText={setAvailabilityUuid} />
      <FormField label="UUID do Encaminhamento (Médica)" value={referralUuid} onChangeText={setReferralUuid} />
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={loadSpecs}><Text style={styles.buttonText}>Carregar Especialidades</Text></TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={loadRefs}><Text style={styles.buttonText}>Listar Encaminhamentos</Text></TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={loadAvail}><Text style={styles.buttonText}>Carregar Disponibilidade</Text></TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={schedule}><Text style={styles.buttonText}>Agendar</Text></TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Especialidades</Text>
      <FlatList data={specialties} keyExtractor={(item) => String(item.uuid || item.specialtyUuid || Math.random())} renderItem={({ item }) => (
        <View style={styles.item}><Text style={styles.itemText}>{item.name || item.specialty || item.uuid}</Text></View>
      )} />
      <Text style={styles.subtitle}>Disponibilidade</Text>
      <FlatList data={availability} keyExtractor={(item) => String(item.uuid || item.detail?.uuid || Math.random())} renderItem={({ item }) => (
        <View style={styles.item}><Text style={styles.itemText}>{(item.date || item.detail?.date) + ' ' + ((item.from || item.detail?.from) || '') + '-' + ((item.to || item.detail?.to) || '')}</Text></View>
      )} />
      <Text style={styles.subtitle}>Encaminhamentos</Text>
      <FlatList data={referrals} keyExtractor={(item) => String(item.uuid || Math.random())} renderItem={({ item }) => (
        <View style={styles.item}><Text style={styles.itemText}>{item.name ? `${item.name} (${item.uuid})` : item.uuid}</Text></View>
      )} />
      {!!status && <Text style={styles.status}>{status}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { color: '#e2e8f0', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  subtitle: { color: '#93c5fd', marginTop: 12 },
  row: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  button: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  item: { padding: 8, borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, marginVertical: 4 },
  itemText: { color: '#93c5fd' },
  status: { marginTop: 12, color: '#93c5fd' }
})