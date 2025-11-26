import React, { useEffect, useState } from 'react'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import LoginScreen from './src/screens/LoginScreen'
import BeneficiaryCreateScreen from './src/screens/BeneficiaryCreateScreen'
import RequestAppointmentScreen from './src/screens/RequestAppointmentScreen'
import ScheduleScreen from './src/screens/ScheduleScreen'
import BeneficiariesScreen from './src/screens/BeneficiariesScreen'
import InactivateScreen from './src/screens/InactivateScreen'
import * as SecureStore from 'expo-secure-store'
import { checkAuth, getUserRole } from './src/api/client'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function PatientTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Solicitar" component={RequestAppointmentScreen} />
      <Tab.Screen name="Agendar" component={ScheduleScreen} />
    </Tab.Navigator>
  )
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Cadastrar" component={BeneficiaryCreateScreen} />
      <Tab.Screen name="Beneficiários" component={BeneficiariesScreen} />
      <Tab.Screen name="Inativar" component={InactivateScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<'patient' | 'admin'>('patient')
  const [isLoading, setIsLoading] = useState(true)

  const theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: '#0f172a', card: '#111827', text: '#e2e8f0' }
  }

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      const authenticated = await checkAuth()
      const role = await getUserRole()
      
      setIsAuthenticated(authenticated)
      setUserRole(role === 'admin' ? 'admin' : 'patient')
    } catch (error) {
      console.error('Authentication check failed:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return null // Or a loading spinner component
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : userRole === 'admin' ? (
          <Stack.Screen name="DashboardAdmin" component={AdminTabs} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="DashboardPatient" component={PatientTabs} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}