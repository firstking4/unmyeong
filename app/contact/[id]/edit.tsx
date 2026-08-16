import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ContactForm } from '@/components/gunghap/ContactForm';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useContacts } from '@/context/ContactsContext';

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = Colors[useColorScheme() ?? 'light'];
  const { getContact, updateContact, loaded } = useContacts();
  const contact = id ? getContact(id) : undefined;

  if (loaded && !contact) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <Text style={{ color: c.text, marginBottom: 12 }}>지인을 찾을 수 없습니다</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: c.tint, fontWeight: '600' }}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  if (!contact) {
    return <View style={{ flex: 1, backgroundColor: c.background }} />;
  }

  return (
    <ContactForm
      initial={contact}
      requireBirthTouch={false}
      submitLabel="저장"
      onCancel={() => router.back()}
      onSubmit={async (input) => {
        await updateContact(contact.id, input);
        router.back();
      }}
    />
  );
}
