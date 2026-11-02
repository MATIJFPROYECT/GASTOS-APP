import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpenseProvider } from '../lib/store';

export default function Layout() {
  return <ExpenseProvider>
    <StatusBar style="dark" />
    <Tabs screenOptions={{ headerShown: false }} tabBar={({ state, emitter, navigateToTab, descriptors }) => <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#FCFCF9', borderTopColor: '#E9EBE4', borderTopWidth: 1 }}>
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', height: 64, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        {state.routes.map((route, index) => {
          const selected = state.index === index;
          const color = selected ? '#37624B' : '#8C928B';
          const title = descriptors[route.key].options.title ?? route.name;
          const icon = route.name === 'index' ? 'pie-chart-outline' : route.name === 'movimientos' ? 'swap-horizontal-outline' : 'repeat-outline';
          return <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={title} accessibilityState={{ selected }} onPress={() => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!selected && !event.defaultPrevented) navigateToTab(route.key);
          }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Ionicons name={icon} size={23} color={color} aria-hidden accessible={false} />
            <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{title}</Text>
          </Pressable>;
        })}
      </View>
    </SafeAreaView>}>
      <Tabs.Screen name="index" options={{ title: 'Resumen' }} />
      <Tabs.Screen name="movimientos" options={{ title: 'Día a día' }} />
      <Tabs.Screen name="fijos" options={{ title: 'Gastos fijos' }} />
    </Tabs>
  </ExpenseProvider>;
}
