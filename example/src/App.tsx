import { StyleSheet, Text, TextInput, View } from 'react-native';
import KeyboardScrollView from 'react-native-keyboard-scroll-view';

export default function App() {
  return (
    <KeyboardScrollView additionalScrollHeight={20}>
      <View style={styles.container}>
        <TextInput placeholder="Enter your name" />
        <TextInput placeholder="Enter your email" />
        <Text>Other content</Text>
      </View>
    </KeyboardScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
