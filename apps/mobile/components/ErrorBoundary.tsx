import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#F5EDE4',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#2D3748', marginBottom: 8, textAlign: 'center' }}>
            Bir hata oluştu
          </Text>
          <Text style={{ fontSize: 14, color: '#718096', textAlign: 'center', marginBottom: 16 }}>
            {this.state.error?.message ?? 'Bilinmeyen hata'}
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: undefined })}
            style={{ backgroundColor: '#E07C3C', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Tekrar dene</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
