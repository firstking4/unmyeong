import { useRouter } from 'expo-router';

import { ContactForm } from '@/components/gunghap/ContactForm';
import { useContacts } from '@/context/ContactsContext';

export default function NewContactScreen() {
  const router = useRouter();
  const { addContact } = useContacts();

  return (
    <ContactForm
      requireBirthTouch
      submitLabel="추가"
      onCancel={() => router.back()}
      onSubmit={async (input) => {
        const created = await addContact(input);
        router.replace(`/contact/${created.id}`);
      }}
    />
  );
}
