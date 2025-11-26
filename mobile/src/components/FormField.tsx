import React from 'react'
import { View, Text, TextInput, StyleSheet } from 'react-native'

export default function FormField({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  field: { marginBottom: 12 },
  label: { color: '#94a3b8', marginBottom: 6, fontSize: 12 },
  input: { height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#334155', backgroundColor: '#0b1220', color: '#e2e8f0', paddingHorizontal: 12 }
})